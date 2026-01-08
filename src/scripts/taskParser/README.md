# taskParser.js

![Jest](https://github.com/aaltoengpsy/taskParser.js/actions/workflows/jest.yml/badge.svg)

Parsing questionnaires to JS objects from human-readable markdown-like text files.

Intended for when you need to integrate questionnaires into a web application. ***Just use Qualtrics / MS forms / Google forms unless you really need something custom!***

## Source File Format

You can find an example task/questionnaire file [here](./exampletasks).

- A single hash symbol (`#`) Marks the beginning of a **page**. Everything between this and the first content item (or page) is considered the page title.

```md
# Task 1

# Questionnaire 1

# Task 2: Instructions
```

- Two or more hash symbols (i.e. `##`, `###`, etc.) can, like in markdown, be used for subheadings within a page. These are assigned a type (the heading's level) based on the number of hashes.

```md
# Page 1 Title

## Subheading Level 2

### Subheading Level 3

#### Subheading Level 4

# Page 2 Title
```

- `>` Marks a **paragraph** (or a **question** if additional parameters, explained below, are included)

```md
# Task 1

> This is the first paragraph of your task instructions.

> This is the second paragraph of your task instructions.

# Questionnaire 1

> This is a paragraph maybe shedding a bit more light on what the questionnaire is about. Alternatively, feel free to give additional instructions here!

> Were the instructions easy to understand?

...

> How many times did you re-read the instructions?

...

> Indicate your agreement with the following statement: I would like to try again in the future.

...

> (Optional) Provide general thoughts about the task.

...

```

- You can include images. Just use the markdown syntax (e.g. `![](image.png)`), but make sure to precede this with the paragraph indicator (`>`)
    - Be aware that depending on how you render your frontend, the image file may need to be in a specific location. For example in Vite, images should be placed in the `public/` directory at the root of the repository.

```md
# Task 1

> This is an introduction to a task. Below this paragraph, you will see an image.

> ![](exampleimage.png)

> This is a second paragraph, maybe filling in some details regarding the image or the task instructions.
```

- `$` is used to indicate additional parameters when a paragraph is meant to act as a **question**. 
    - The first parameter indicates the type of the **question**. This can essentially be anything you choose (e.g. `text`, `textarea`, `number`). 
    - Further parameter parsing is currently available for **question** types `slider`, `option` and `likert`.
        - These should include additional parameters separated by semicolons (`;`).
            - There can be as many options to an `option` **question** as you'd like.
            - `range` and `likert` parameters are: `minimum value; maximum value; minimum label; maximum label`
                - If no parameters are provided, `slider` and `likert` questions will default to `1; 10; min; max`, while options will default to `Yes; No`
                - You can also indicate an unlimited number of additional parameters for `slider` and `likert` **question**s after the initial 4; e.g. `$slider; minValue; maxValue; minLabel; maxLabel; additionalParam_1; additionalParam_2`

```md
# Questionnaire 1

> Were the instructions easy to understand?

$option; Yes; No

> How many times did you re-read the instructions?

$number

> Indicate your agreement with the following statement: I would like to try again in the future.

$likert; 1; 7; Strongly Disagree; Strongly Agree

> How confident would you be in your ability to do at least as well next time?

$slider; 0; 100; Not at all confident; Very confident

> (Optional) Provide general thoughts about the task.

$text
```

> **N.B.** that you can add line breaks, tabs and spaces as you see fit to make the file more readable to you. These are trimmed out when parsing the file.

### Randomized Sections

You can randomize the order of a certain selection of pages by wrapping it in `%%` and using the `randomized` keyword. This can be handy for questionnaires where you need certain sections to always be in a set order, but would like to randomize the order of questions at other times.

```md
%% RANDOMIZED

# Random 1

...

# Random 2

...

# Random 3

%%
```

## Usage

In the following example we simply define the raw text content of our tasks in code.

```js
import loadTasks from './taskParser.js'

const tasksRaw = `
# Introduction

> This is an introduction to your study / questionnaire / whatever.

> Feel free to put something in here.

# Questionnaire

> Please enter your age

$number

> Please enter your profession

$text

> How experienced are you in filling out questionnaires?

$likert; 1; 7; Not at all experienced; Very experienced
`

const tasks = loadTasks(tasksRaw)

console.log(tasks)
```

It's that easy!

You can also choose to load the value of `tasksRaw` from a file, but the how you import the contents of the file will vary depending on your framework and whether you are loading the tasks on the server or client side.

For example, in Vite, we would place our source file in the `public` directory at the root of the project.

```js
import tasksRaw from '/public/tasks?raw' // ?raw loads the raw text contents of the file

...

const tasks = loadTasks(tasksRaw)
```

If you want to load the tasks in server-side code, you can also use Node's `fs`.

```js
const fs = require('fs')
const tasksRaw = fs.readFileSync('./exampletasks').toString()

...

const tasks = loadTasks(tasksRaw)
```

Now you just need to code the part where everything is rendered ...and the data is collected ...and saved 😄

### Handling Randomized Sections

The order of the pages within each randomized section will be randomized ***during parsing***, yielding a different order of pages every time `loadTasks()` is called. Note that there is currently no built-in way to identify which pages have been randomized after parsing. However, the original order of the tasks (as defined in the source file) is preserved in the `sourceIndex` field:

```js
[
    {
        sourceIndex: 1,
        title: "Random 2"
    },
    {
        sourceIndex: 2,
        title: "Random 3"
    },
    {
        sourceIndex: 0,
        title: "Random 1"
    }
]
```

You could then use `sourceIndex` so as not to mix up questionnaire responses from randomized sections. Here's a simplistic semi-pseudocode example:

```js
const tasks = loadTasks(```
%% RANDOMIZE 
# T1 
> Q1 
$text

# T2 
> Q2 
$text
```)

/* Tasks is now either [{...T1}, {...T2}] or [{...T2}, {...T1}] */

const responses = {}

const saveResponse = (qid, response) => {
    responses[qid] = response
}

for (t of tasks) {
    for (q of questions) {
        const response = askQuestion(q.question)
        saveResponse(t.sourceIndex, response)
    }
}

console.log(responses) // Should now print {"0": 'response_to_q1', "1": 'response_to_q2'}
```

### Example Output

```js
[
    {
        sourceIndex: 0,
        title: "Task 1",
        content: [
            {
                type: "h2",
                text: "This is a subheading."
            },
            {
                type: "paragraph",
                text: "This is a paragraph."
            },
            {
                type: "image",
                url: "exampleimage.png"
            },
            {
                type: "paragraph",
                text: "This is a second paragraph."
            }
        ]
    },
    {
        sourceIndex: 1,
        title: "Questionnaire 1",
        content: [
            {
                text: "These are the initial instructions for filling out the questionnaire.",
                type: "paragraph"
            },
            {
                url: "exampleimage.png",
                type: "image"
            },
            {
                question: "What did you think of the task?",
                type: "text"
            },
            {
                question: "How many times did you try the task?",
                type: "number"
            },
            {
                question: "This task made me feel ___",
                type: "likert",
                min: 1,
                max: 7,
                minLabel: "Unpleasant",
                maxLabel: "Pleasant"
            },
            {
                question: "Were the instructions clear?",
                type: "option",
                options: ["Yes", "No", "Maybe"]
            },
            {
                question: "Please rate the task:",
                type: "slider",
                min: 0,
                max: 100,
                minLabel: 'Bad',
                maxLabel: 'Good'
            }
        ]
    }
]
```