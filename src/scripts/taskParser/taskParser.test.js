import loadTasks from "./taskParser.js"

describe('When an empty string is inserted', () => {
    test('An empty array is returned', () => {
        expect(loadTasks('').length).toBe(0)
    })
})

describe('When a task file is loaded', () => {
    test('Pages are separated using single # symbols', () => {
        const tasks = '# # # #'
        expect(loadTasks(tasks).length).toBe(4)
    })

    test('Page titles are assigned', () => {
        const tasks = '# Title 1 # # Title 2'
        expect(loadTasks(tasks)[0].title).toBe('Title 1')
        expect(loadTasks(tasks)[1].title).toBe('')
        expect(loadTasks(tasks)[2].title).toBe('Title 2')
    })

    test('Page titles are separated from paragraphs', () => {
        const tasks = '# Title 1 > P1 > P2 # > P3 # Title 2 > P4'
        expect(loadTasks(tasks)[0].title).toBe('Title 1')
        expect(loadTasks(tasks)[1].title).toBe('')
        expect(loadTasks(tasks)[2].title).toBe('Title 2')
    })
})

describe('When a page is parsed', () => {
    test('The correct number of content items is parsed', () => {
        const tasks = '#>>>>## ###'
        expect(loadTasks(tasks)[0].content.length).toBe(6)
    })

    test('Paragraph text is assigned correctly', () => {
        const tasks = '# > P1 > > P2'
        expect(loadTasks(tasks)[0].content[0].text).toBe('P1')
        expect(loadTasks(tasks)[0].content[1].text).toBe('')
        expect(loadTasks(tasks)[0].content[2].text).toBe('P2')
    })

    test('Subheading text is assigned correctly', () => {
        const tasks = '# ## H1 > P1 ### H2 > P2 > P3 ## H3'
        const content = loadTasks(tasks)[0].content
        expect(content[0].text).toBe('H1')
        expect(content[2].text).toBe('H2')
        expect(content[5].text).toBe('H3')
    })

    test('Subheading type (level) is assigned correctly', () => {
        const tasks = '# ## H2 ### H3 ## H2-2 #### H4'
        const content = loadTasks(tasks)[0].content
        expect(content[0].type).toBe('h2')
        expect(content[1].type).toBe('h3')
        expect(content[2].type).toBe('h2')
        expect(content[3].type).toBe('h4')
    })

    test('Core types are assigned correctly', () => {
        const tasks = '# > > ![]() > $any'
        const content = loadTasks(tasks)[0].content
        expect(content[0].type).toBe('paragraph')
        expect(content[1].type).toBe('image')
        expect(content[2].type).toBe('any')
    })

    test('Question types are assigned correctly', () => {
        const tasks = '# > $likert > $slider > $option'
        const content = loadTasks(tasks)[0].content
        expect(content[0].type).toBe('likert')
        expect(content[1].type).toBe('slider')
        expect(content[2].type).toBe('option')
    })
})

describe('When an image is parsed', () => {
    test('Image url is assigned correctly', () => {
        const tasks = '#>![](url)'
        const content = loadTasks(tasks)[0].content
        expect(content[0].url).toBe('url')
    })
})

describe('When a likert or a slider question is parsed', () => {
    test('Min and max values are assigned correctly', () => {
        const tasks = '#>$slider;-50;50;;>$likert;-5;5;;'
        const content = loadTasks(tasks)[0].content
        expect(content[0].min).toBe(-50)
        expect(content[0].max).toBe(50)
        expect(content[1].min).toBe(-5)
        expect(content[1].max).toBe(5)
    })
    test('Min and max labels are assigned correctly', () => {
        const tasks = '#>$slider;-50;50;SLL;SLR>$likert;-5;5;LLL;LLR'
        const content = loadTasks(tasks)[0].content
        expect(content[0].minLabel).toBe('SLL')
        expect(content[0].maxLabel).toBe('SLR')
        expect(content[1].minLabel).toBe('LLL')
        expect(content[1].maxLabel).toBe('LLR')
    })
    test('If no parameters are given default values 1-10 are used', () => {
        const tasks = '#>$slider>$likert'
        const content = loadTasks(tasks)[0].content
        expect(content[0].min).toBe(1)
        expect(content[0].max).toBe(10)
        expect(content[1].min).toBe(1)
        expect(content[1].max).toBe(10)
    })
    test('If no parameters are given default labels \"min\" and \"max\" are used', () => {
        const tasks = '#>$slider>$likert'
        const content = loadTasks(tasks)[0].content
        expect(content[0].minLabel).toBe('min')
        expect(content[0].maxLabel).toBe('max')
        expect(content[1].minLabel).toBe('min')
        expect(content[1].maxLabel).toBe('max')
    })
    test('Additional parameters after the initial 4 are passed on as a list', () => {
        const tasks = '#>$slider;1;10;LL;LR;P>$likert;1;10;LL;LR;P;A;B'
        const content = loadTasks(tasks)[0].content
        console.log(content[0].additionalParams)
        expect(content[0].additionalParams.length).toEqual(1)
        expect(content[0].additionalParams[0]).toBe('P')
        expect(content[1].additionalParams.length).toEqual(3)
        expect(content[1].additionalParams[0]).toBe('P')
        expect(content[1].additionalParams[1]).toBe('A')
        expect(content[1].additionalParams[2]).toBe('B')
    })
})

describe('When an option question is parsed', () => {
    test('Options are parsed correctly', () => {
        const tasks = '#>$option;A;B;C'
        const content = loadTasks(tasks)[0].content
        expect(content[0].options).toEqual(['A', 'B', 'C'])
    })
    test('If no parameters are given default values \"Yes\" and \"No\" are used', () => {
        const tasks = '#>$option'
        const content = loadTasks(tasks)[0].content
        expect(content[0].options).toEqual(['Yes', 'No'])
    })
})

describe('When a randomized section is loaded', () => {
    test('Original page order is preserved with sourceIndex', () => {
        const tasks = '%%RANDOMIZE#P1#P2#P3%%'
        const pages = loadTasks(tasks)
        expect(pages.find((p) => p.sourceIndex === 0).title).toEqual('P1')
        expect(pages.find((p) => p.sourceIndex === 1).title).toEqual('P2')
        expect(pages.find((p) => p.sourceIndex === 2).title).toEqual('P3')
    })

    test('Only the order of the randomized section is randomized', () => {
        const tasks = '#P1%%RANDOMIZE#P2#P3#P4%%#P5'
        const pages = loadTasks(tasks)
        expect(pages[0].title).toBe('P1')
        expect(pages[4].title).toBe('P5')
    })
})