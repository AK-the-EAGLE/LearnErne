const question = (id, prompt, options, correctOptionId, correctFeedback, incorrectFeedback) => ({
  questionId: id,
  prompt,
  options: options.map(([optionId, label]) => ({ optionId, label })),
  correctOptionId,
  correctFeedback,
  incorrectFeedback,
});

const lesson = (lessonId, title, introduction, explanation, example, activity, questions) => ({
  lessonId,
  title,
  introduction,
  explanation,
  example,
  activity,
  quiz: {
    passPercent: 50,
    questions,
  },
});

export const courseCatalog = [
  {
    title: 'Plan a learning goal',
    slug: 'learning-plan',
    category: 'Planning',
    level: 'All levels',
    description: 'Turn a broad interest into a focused goal, a manageable plan, and a repeatable review habit.',
    contentVersion: 2,
    steps: [
      { stepId: 'name-goal', title: 'Name one learning goal', detail: 'Describe a skill you want to build and why it matters to you.' },
      { stepId: 'choose-steps', title: 'Choose a few next steps', detail: 'List topics, lessons, or small activities that can help you explore the goal.' },
      { stepId: 'review-plan', title: 'Review and adjust your plan', detail: 'Decide which step to try first and what you may need to change later.' },
    ],
    weeklyTasks: [
      { taskId: 'write-goal', title: 'Write down one learning goal.' },
      { taskId: 'list-topics', title: 'List two or three topics to explore.' },
      { taskId: 'pick-first-step', title: 'Choose a small first step to try.' },
    ],
    modules: [
      {
        moduleId: 'choose-a-focus',
        title: 'Choose a useful focus',
        lessons: [
          lesson(
            'name-the-outcome',
            'Name the outcome you want',
            'A useful learning plan begins with a change you can describe, not just a topic you find interesting.',
            'Write the goal as an observable ability: “I can…” or “I can create…”. Keep it within your influence. A broad subject can stay as context, but the outcome should tell you what practice would look like. Add a reason so that you can make trade-offs when time is limited.',
            'Broad: “Learn design.” More actionable: “I can arrange a one-page event announcement so readers notice the date and venue first.” The second goal suggests a practice task and a way to review it.',
            { title: 'Write an outcome statement', instructions: 'Choose one skill. Write an “I can…” statement describing what you want to do, who it is useful for, and why it matters to you.', deliverable: 'One outcome statement in your own words.' },
            [
              question('outcome-observable', 'Which goal is easiest to turn into a practice task?', [['a', 'Learn everything about writing'], ['b', 'Draft a clear 150-word project update'], ['c', 'Become talented'], ['d', 'Read whenever I have time']], 'b', 'A specific output gives you something concrete to practice and review.', 'Try describing an action or output you could actually make.'),
              question('goal-influence', 'Why should a learning goal focus on an ability within your influence?', [['a', 'It guarantees a particular result'], ['b', 'It makes practice choices and progress easier to evaluate'], ['c', 'It removes the need to review'], ['d', 'It makes the goal permanent']], 'b', 'You can control practice and review more directly than external outcomes.', 'Consider which part you can act on even when outside conditions change.'),
            ],
          ),
          lesson(
            'set-a-realistic-scope',
            'Make the goal manageable',
            'A goal can be meaningful and still be too large for a first learning cycle.',
            'Limit the audience, situation, output, or time horizon. A small first version helps you learn what the larger goal requires. This is not lowering standards; it is creating a feedback loop before investing in a large plan.',
            'Instead of “master public speaking,” try “deliver a three-minute explanation of one project idea to two colleagues and note where they ask questions.”',
            { title: 'Shrink one broad goal', instructions: 'Take the outcome statement from the previous lesson. Narrow it by choosing one situation and one small output you can attempt soon.', deliverable: 'A first-cycle version of your goal.' },
            [
              question('scope-feedback', 'What is a practical reason to make a first learning goal smaller?', [['a', 'Small goals never need effort'], ['b', 'A short cycle creates feedback that can improve the next plan'], ['c', 'It avoids measuring anything'], ['d', 'It guarantees success']], 'b', 'A short cycle helps you adjust the plan using evidence from practice.', 'Think about how a smaller attempt gives you information sooner.'),
              question('scope-boundary', 'Which is a useful way to narrow a broad goal?', [['a', 'Add more unrelated topics'], ['b', 'Choose one situation and one output'], ['c', 'Remove all deadlines and context'], ['d', 'Choose a goal based on someone else’s results']], 'b', 'A defined situation and output give the learning cycle practical boundaries.', 'Look for a boundary that makes the next action clearer.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'focus-checkpoint',
          title: 'Focus checkpoint',
          prompt: 'State your learning outcome and explain why this first version is small enough to try.',
          instructions: 'Use your own words. Include the action or output you want to practice and one scope boundary.',
        },
      },
      {
        moduleId: 'make-a-plan',
        title: 'Plan, practice, and review',
        lessons: [
          lesson(
            'choose-learning-steps',
            'Choose useful next steps',
            'A plan is a short sequence of activities that helps you move from your current ability toward your outcome.',
            'Start with what you already know, then identify the gap that most blocks the outcome. Choose a small number of steps that build on one another. Each step should produce evidence: a draft, an explanation, a comparison, or a practice attempt.',
            'For a project update: inspect one clear example, outline the key information, draft a short update, then ask a reader what remains unclear.',
            { title: 'Draft a three-step path', instructions: 'Write three actions in order. Include at least one example to study and one thing you will make or practice.', deliverable: 'A sequence of three actions, each with a small output.' },
            [
              question('steps-output', 'What makes a learning step especially useful for a plan?', [['a', 'It names a broad topic only'], ['b', 'It produces evidence you can inspect or discuss'], ['c', 'It depends on a perfect schedule'], ['d', 'It has no connection to the goal']], 'b', 'Evidence makes it possible to learn from an attempt and choose what comes next.', 'Choose the option that makes the step reviewable.'),
              question('steps-sequence', 'How should several learning steps usually relate?', [['a', 'They build toward the chosen outcome'], ['b', 'They cover as many topics as possible'], ['c', 'They all repeat the easiest action'], ['d', 'They avoid practice until the end']], 'a', 'A useful sequence connects each action to the goal and the next action.', 'Check whether the activities help you reach the stated outcome.'),
            ],
          ),
          lesson(
            'review-and-adjust',
            'Review and adjust your plan',
            'A plan becomes more useful when you treat it as a working draft and learn from each attempt.',
            'After practice, record what you tried, what happened, and what you would change. Separate observations from guesses. Then choose one next action: repeat with a variation, get targeted feedback, or study a missing concept. Revising the plan is part of learning, not a sign that the original plan failed.',
            'Observation: “Two readers missed the deadline in my update.” Possible next test: put the deadline in the opening sentence and ask another reader to find it.',
            { title: 'Write a review prompt', instructions: 'Create three questions for after a practice session: what you tried, what evidence you noticed, and what you will do next.', deliverable: 'A reusable three-question review.' },
            [
              question('review-evidence', 'Which is an observation rather than a guess?', [['a', 'The readers did not care'], ['b', 'Two readers asked when the work would be ready'], ['c', 'My plan is useless'], ['d', 'I am naturally bad at updates']], 'b', 'It describes something observed and can inform a specific next experiment.', 'Separate what happened from an explanation you have not checked.'),
              question('review-adjustment', 'What is a useful response when practice shows a plan needs adjustment?', [['a', 'Keep every step unchanged'], ['b', 'Choose a specific next experiment using what you learned'], ['c', 'Discard all progress'], ['d', 'Wait until motivation is perfect']], 'b', 'An informed next experiment uses evidence while keeping the learning goal in view.', 'The review should lead to a manageable next action.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'plan-checkpoint',
          title: 'Plan checkpoint',
          prompt: 'Summarize your first three learning actions and name the evidence you will review afterward.',
          instructions: 'Include how you will decide whether to repeat, revise, or move to the next step.',
        },
      },
    ],
  },
  {
    title: 'Design foundations',
    slug: 'design-foundations',
    category: 'Design',
    level: 'Beginner',
    description: 'Practice hierarchy, spacing, and contrast using a small, reviewable page-layout exercise.',
    contentVersion: 2,
    steps: [
      { stepId: 'review-principles', title: 'Review a design principle', detail: 'Choose one principle, such as hierarchy or contrast, and note what it helps communicate.' },
      { stepId: 'practice-layout', title: 'Try a small layout exercise', detail: 'Arrange a few pieces of sample content and consider what should draw attention first.' },
      { stepId: 'reflect-design', title: 'Reflect on your choices', detail: 'Write down one decision you would keep and one you would revisit.' },
    ],
    weeklyTasks: [
      { taskId: 'choose-principle', title: 'Choose one design principle to explore.' },
      { taskId: 'make-sketch', title: 'Make a quick sketch or layout experiment.' },
      { taskId: 'note-observation', title: 'Note one observation from your practice.' },
    ],
    modules: [
      {
        moduleId: 'visual-hierarchy',
        title: 'Guide attention with hierarchy',
        lessons: [
          lesson(
            'hierarchy-and-purpose',
            'Design for a reading priority',
            'Visual hierarchy is the order in which a design invites people to notice information.',
            'Begin by naming the audience and the most important action or fact. Differences in size, position, weight, and whitespace can signal priority. Use a few consistent levels rather than styling every item as equally important. Check the hierarchy by stepping back or asking someone what they noticed first.',
            'On an event notice, the event name and date may deserve the strongest emphasis. A decorative quote should not compete with the information people need to act.',
            { title: 'Rank the content', instructions: 'Choose a simple announcement. List its content in the order a reader needs it, then sketch three levels of emphasis.', deliverable: 'A content priority list and a rough hierarchy sketch.' },
            [
              question('hierarchy-first', 'What should guide the strongest visual emphasis?', [['a', 'The content with the most decorative potential'], ['b', 'The information most important to the audience’s task'], ['c', 'Every item equally'], ['d', 'The last item added']], 'b', 'Hierarchy should support the audience’s purpose and the information they need.', 'Start with the reader’s task rather than decoration.'),
              question('hierarchy-test', 'How can you quickly check whether a hierarchy is working?', [['a', 'Ask what a viewer noticed first'], ['b', 'Count the number of colors only'], ['c', 'Hide all headings'], ['d', 'Add more font sizes']], 'a', 'A quick first-impression check reveals whether emphasis matches the intended priority.', 'Test the order in which information is noticed.'),
            ],
          ),
          lesson(
            'spacing-and-grouping',
            'Use spacing to show relationships',
            'Spacing is not empty decoration; it helps people see which items belong together.',
            'Keep related items closer to one another and separate distinct groups. Align edges where relationships should feel orderly. Repeat spacing values for similar relationships so the page feels consistent. If everything is crowded or every gap is identical, the grouping may be difficult to read.',
            'A heading, short explanation, and button can form one group. A larger gap before the next section signals a change in topic.',
            { title: 'Create a spacing map', instructions: 'On your sketch, mark related content groups. Use close spacing within a group and a larger gap between groups. Note one alignment you will repeat.', deliverable: 'An annotated layout sketch showing grouping and alignment.' },
            [
              question('spacing-related', 'How does spacing usually communicate that items are related?', [['a', 'Related items are placed closer together'], ['b', 'Every gap is made as large as possible'], ['c', 'Alignment is avoided'], ['d', 'All content is placed in one block']], 'a', 'Proximity is a simple cue for grouping related content.', 'Compare gaps within a group with gaps between groups.'),
              question('spacing-consistent', 'Why repeat spacing values for similar relationships?', [['a', 'Consistency helps the layout feel orderly and easier to scan'], ['b', 'It guarantees users will agree'], ['c', 'It removes the need for hierarchy'], ['d', 'It makes all content equally important']], 'a', 'A small spacing system makes repeated relationships easier to recognize.', 'Think about how repeated patterns help scanning.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'hierarchy-checkpoint',
          title: 'Hierarchy checkpoint',
          prompt: 'Describe what a viewer should notice first in your sketch and how spacing supports the content groups.',
          instructions: 'Name one emphasis choice and one grouping or alignment choice.',
        },
      },
      {
        moduleId: 'contrast-and-review',
        title: 'Improve contrast and review',
        lessons: [
          lesson(
            'contrast-with-purpose',
            'Use contrast with purpose',
            'Contrast helps distinguish information, but each difference should have a reason.',
            'Contrast can come from size, weight, shape, color, or position. Use it to clarify hierarchy or make an element distinguishable. Check text against its background for legibility; color alone should not be the only way important meaning is conveyed. Avoid adding contrast everywhere, because emphasis loses value when all elements compete.',
            'A dark heading on a light background can be clear without using a separate bright color for every paragraph. A status can include a word or icon as well as color.',
            { title: 'Review emphasis and legibility', instructions: 'Circle the two strongest contrasts in your sketch. Explain their purpose and check that all text can be read without relying on color alone.', deliverable: 'Two purposeful contrast choices and one legibility check.' },
            [
              question('contrast-purpose', 'A strong contrast is most useful when it…', [['a', 'Clarifies an intended relationship or priority'], ['b', 'Decorates every element'], ['c', 'Replaces all labels'], ['d', 'Makes text harder to read']], 'a', 'Contrast should communicate a meaningful distinction or priority.', 'Look for a contrast choice with a clear communication purpose.'),
              question('contrast-color', 'Why should important meaning not rely on color alone?', [['a', 'People may not perceive or distinguish the colors as intended'], ['b', 'Color is never useful'], ['c', 'It prevents using headings'], ['d', 'It guarantees a larger layout']], 'a', 'Additional cues such as text and shape make meaning more robust.', 'Consider what happens when colors are difficult to distinguish.'),
            ],
          ),
          lesson(
            'iterate-from-feedback',
            'Make one evidence-based revision',
            'A small design review can replace guesswork with a useful next change.',
            'Ask a reviewer a focused question tied to the intended reading task. Watch what they notice or where they hesitate before explaining the design. Record the observation, then change one thing at a time. A small revision makes it easier to understand whether the change helped.',
            'Ask: “Please find the date and location.” If the reviewer searches for the date, consider its position or emphasis before changing unrelated colors.',
            { title: 'Plan a one-change review', instructions: 'Write one question a reviewer can answer by looking at your sketch. Predict one possible observation and a single revision you might test.', deliverable: 'A review question and a testable one-change revision.' },
            [
              question('iteration-question', 'Which review prompt gives the most actionable evidence?', [['a', 'Do you like it?'], ['b', 'Can you find the date and tell me where you looked first?'], ['c', 'Is design important?'], ['d', 'Would you change everything?']], 'b', 'A task-based prompt reveals whether the layout supports the reader’s task.', 'Ask for an action you can observe rather than a general opinion.'),
              question('iteration-one', 'Why change one thing at a time during a small review?', [['a', 'It helps connect a revision to what changed'], ['b', 'It prevents future learning'], ['c', 'It guarantees approval'], ['d', 'It removes the need for evidence']], 'a', 'A focused change makes it easier to judge whether the adjustment helped.', 'Keep the test small enough to learn from.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'review-checkpoint',
          title: 'Review checkpoint',
          prompt: 'Record one observation from reviewing your design and the single revision you would test next.',
          instructions: 'Separate what you observed from what you infer, then state your next test.',
        },
      },
    ],
  },
  {
    title: 'Research basics',
    slug: 'research-basics',
    category: 'Research',
    level: 'Beginner',
    description: 'Practice asking focused questions, comparing sources, and writing a careful evidence-based summary.',
    contentVersion: 2,
    steps: [
      { stepId: 'ask-question', title: 'Write a focused question', detail: 'Turn a broad topic into one question that can guide your exploration.' },
      { stepId: 'compare-sources', title: 'Compare a couple of sources', detail: 'Look for their purpose, evidence, and points of agreement or difference.' },
      { stepId: 'summarize-finding', title: 'Summarize what you found', detail: 'Capture a short summary and one question you still have.' },
    ],
    weeklyTasks: [
      { taskId: 'draft-question', title: 'Draft one question about a topic you care about.' },
      { taskId: 'review-sources', title: 'Compare two sources on that topic.' },
      { taskId: 'write-summary', title: 'Write a brief summary in your own words.' },
    ],
    modules: [
      {
        moduleId: 'ask-and-search',
        title: 'Ask a focused question',
        lessons: [
          lesson(
            'shape-a-question',
            'Turn a topic into a research question',
            'A broad topic can be a useful starting point, but a focused question helps you decide what information to seek.',
            'Specify the subject, context, and kind of answer you need. A manageable question should be answerable with the time and sources you have. Avoid wording that presumes a conclusion; open questions make room for evidence that complicates your first idea.',
            'Broad: “Public transport.” More focused: “What barriers do shift workers in my town report when using evening buses?” The second identifies a group, context, and kind of evidence to look for.',
            { title: 'Draft and narrow a question', instructions: 'Write one broad topic, then narrow it by adding a group or context and the kind of information that would help answer it.', deliverable: 'A focused, open-ended research question.' },
            [
              question('research-focused', 'Which question is most focused and open to evidence?', [['a', 'Is transport good?'], ['b', 'Why is my preferred option always best?'], ['c', 'What barriers do evening-shift workers report when using local buses?'], ['d', 'Everything about cities']], 'c', 'It names a group, context, and evidence to seek without assuming the answer.', 'Choose a question with clear boundaries that does not assume its conclusion.'),
              question('research-scope', 'What is a practical benefit of narrowing a question?', [['a', 'It helps decide which information and sources are relevant'], ['b', 'It guarantees agreement'], ['c', 'It removes uncertainty'], ['d', 'It makes evidence unnecessary']], 'a', 'A clear scope helps guide searching and keeps the work manageable.', 'Think about how a question guides the next search.'),
            ],
          ),
          lesson(
            'find-relevant-sources',
            'Search with a source plan',
            'Search results are a starting point. A small source plan can make your exploration more deliberate.',
            'Write down key terms, synonyms, and the source types likely to contain useful evidence. Look beyond the first result. Note who created a source, when, for what purpose, and what evidence it uses. A source can be useful for one question while being insufficient for another.',
            'For a question about evening buses, search route schedules as well as first-person accounts or local service reports. A schedule can show planned service but cannot by itself explain a rider’s experience.',
            { title: 'Create a search plan', instructions: 'List two search terms, one alternative phrasing, and two different source types. For each source type, note what it can and cannot tell you.', deliverable: 'A brief search plan with limits for each source type.' },
            [
              question('source-purpose', 'Why record who created a source and its purpose?', [['a', 'Context helps you judge what the source can support'], ['b', 'It proves the source is always wrong'], ['c', 'It replaces reading the source'], ['d', 'It guarantees the source is current']], 'a', 'Authorship and purpose are context for judging a source’s relevance and limits.', 'Think about what context tells you before relying on a source.'),
              question('source-type', 'What is a careful way to use a route schedule?', [['a', 'Treat it as complete evidence of every rider’s experience'], ['b', 'Use it to understand planned service and note what it cannot show'], ['c', 'Ignore its date and author'], ['d', 'Assume it answers every transport question']], 'b', 'A schedule can show planned service, but its scope has limits.', 'Match each source to the evidence it can reasonably provide.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'question-checkpoint',
          title: 'Question checkpoint',
          prompt: 'Write your research question and name two kinds of sources that could inform it, including one limitation.',
          instructions: 'Keep the question open to evidence that may differ from your initial expectation.',
        },
      },
      {
        moduleId: 'compare-and-summarize',
        title: 'Compare evidence and summarize',
        lessons: [
          lesson(
            'compare-evidence',
            'Compare sources carefully',
            'Comparing sources means looking at their evidence and scope, not just counting how many agree.',
            'Check dates, methods, authorship, and the groups or cases covered. Notice agreement, disagreement, and missing information. Two sources may use different definitions or examine different contexts. Keep track of which claim came from which source so that you can represent it accurately.',
            'A service report about scheduled routes and an interview about a late-night commute can both be informative while describing different parts of the same issue.',
            { title: 'Build a comparison note', instructions: 'Choose two sources. For each, record its main claim, evidence type, date or context, and one limitation. Then note one point of agreement or difference.', deliverable: 'A comparison note that distinguishes claims from evidence.' },
            [
              question('compare-agreement', 'If two sources appear to disagree, what is a useful first check?', [['a', 'Whether they use the same definitions, context, and evidence scope'], ['b', 'Which source confirms your preference'], ['c', 'Whether one can be ignored immediately'], ['d', 'How many pages each has']], 'a', 'Different definitions or contexts can explain apparent disagreement.', 'Compare the scope and methods before drawing a conclusion.'),
              question('compare-count', 'Why is simply counting agreeing sources not enough?', [['a', 'Sources vary in methods, relevance, and evidence quality'], ['b', 'Agreement is never informative'], ['c', 'All sources have identical scope'], ['d', 'Evidence cannot be compared']], 'a', 'The basis and relevance of each source matter, not only the number of sources.', 'Look at what supports each claim.'),
            ],
          ),
          lesson(
            'write-a-grounded-summary',
            'Write a summary that shows its limits',
            'A useful summary answers the question as far as the evidence allows and makes uncertainty visible.',
            'State the answer, identify the evidence behind it, and mention a limitation or unanswered question. Distinguish source claims from your interpretation. Paraphrase accurately and keep notes about where information came from. If evidence is mixed, describe the difference rather than forcing a simple conclusion.',
            '“The route schedule lists service until 10 p.m., while two interviews describe difficulty reaching the stop after late shifts. These sources describe planned hours and individual experiences; more rider accounts would help show how common the problem is.”',
            { title: 'Write a three-part summary', instructions: 'Using your comparison note, write: a tentative answer, the evidence supporting it, and one limitation or next question.', deliverable: 'A short summary that separates evidence from interpretation.' },
            [
              question('summary-limits', 'What should a careful summary do when the evidence is incomplete?', [['a', 'State a reasonable answer and name what remains uncertain'], ['b', 'Hide every limitation'], ['c', 'Claim certainty anyway'], ['d', 'Copy a source without attribution']], 'a', 'Naming limits helps readers understand how far the evidence supports the answer.', 'Represent what you know and what you do not yet know.'),
              question('summary-attribution', 'Why keep track of which source supports each claim?', [['a', 'It helps represent evidence accurately and attribute ideas'], ['b', 'It makes paraphrasing unnecessary'], ['c', 'It proves every source is reliable'], ['d', 'It guarantees there are no gaps']], 'a', 'Traceable notes support accurate summaries and responsible attribution.', 'Think about how you would verify and credit a claim later.'),
            ],
          ),
        ],
        checkpoint: {
          checkpointId: 'evidence-checkpoint',
          title: 'Evidence checkpoint',
          prompt: 'Summarize what your sources suggest and identify one limitation that affects your conclusion.',
          instructions: 'Name the evidence behind your summary and one question you would investigate next.',
        },
      },
    ],
  },
];
