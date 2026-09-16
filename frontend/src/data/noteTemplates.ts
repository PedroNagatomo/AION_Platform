export interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  content: string;
}

export const noteTemplates: NoteTemplate[] = [
  {
    id: 'meeting',
    name: 'Meeting Notes',
    icon: '📋',
    description: 'Template for meeting minutes',
    content: `<h1>Meeting Notes</h1>
<h2>Date: </h2>
<h2>Attendees:</h2>
<ul>
  <li></li>
</ul>
<h2>Agenda:</h2>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>
<h2>Discussion Points:</h2>
<ul>
  <li></li>
</ul>
<h2>Action Items:</h2>
<ul>
  <li>☐ Task 1 - Assignee: - Due:</li>
  <li>☐ Task 2 - Assignee: - Due:</li>
</ul>
<h2>Next Meeting:</h2>
<p></p>`,
  },
  {
    id: 'task',
    name: 'Task List',
    icon: '✅',
    description: 'Track tasks and todos',
    content: `<h1>Task List</h1>
<h2>Priority: High</h2>
<ul>
  <li>☐ Task 1</li>
  <li>☐ Task 2</li>
</ul>
<h2>Priority: Medium</h2>
<ul>
  <li>☐ Task 3</li>
  <li>☐ Task 4</li>
</ul>
<h2>Priority: Low</h2>
<ul>
  <li>☐ Task 5</li>
</ul>
<h2>Completed</h2>
<ul>
  <li>✅ Done</li>
</ul>`,
  },
  {
    id: 'project',
    name: 'Project Plan',
    icon: '📊',
    description: 'Project planning template',
    content: `<h1>Project Plan</h1>
<h2>Project Name:</h2>
<p></p>
<h2>Objective:</h2>
<p></p>
<h2>Scope:</h2>
<ul>
  <li>In scope:</li>
  <li>Out of scope:</li>
</ul>
<h2>Timeline:</h2>
<ul>
  <li>Start date:</li>
  <li>End date:</li>
  <li>Milestones:</li>
</ul>
<h2>Team:</h2>
<ul>
  <li>Project Manager:</li>
  <li>Team members:</li>
</ul>
<h2>Risks:</h2>
<ul>
  <li>Risk 1 - Mitigation:</li>
  <li>Risk 2 - Mitigation:</li>
</ul>`,
  },
  {
    id: 'daily',
    name: 'Daily Journal',
    icon: '📓',
    description: 'Daily reflection and notes',
    content: `<h1>Daily Journal</h1>
<h2>Date: </h2>
<h2>Today's Goals:</h2>
<ul>
  <li>☐ Goal 1</li>
  <li>☐ Goal 2</li>
  <li>☐ Goal 3</li>
</ul>
<h2>What went well:</h2>
<ul>
  <li></li>
</ul>
<h2>What could be improved:</h2>
<ul>
  <li></li>
</ul>
<h2>Gratitude:</h2>
<ul>
  <li>🙏</li>
  <li>🙏</li>
  <li>🙏</li>
</ul>
<h2>Tomorrow's plan:</h2>
<p></p>`,
  },
  {
    id: 'research',
    name: 'Research Notes',
    icon: '🔍',
    description: 'Research and references',
    content: `<h1>Research Notes</h1>
<h2>Topic:</h2>
<p></p>
<h2>Key Questions:</h2>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>
<h2>Sources:</h2>
<ul>
  <li>📚 Source 1 - <em>URL</em></li>
  <li>📚 Source 2 - <em>URL</em></li>
</ul>
<h2>Important Quotes:</h2>
<blockquote>
  <p>"Quote here" - Author</p>
</blockquote>
<h2>Summary:</h2>
<p></p>`,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    icon: '💡',
    description: 'Ideas and brainstorming',
    content: `<h1>Brainstorming</h1>
<h2>Topic:</h2>
<p></p>
<h2>Ideas (no filter):</h2>
<ul>
  <li>💡 Idea 1</li>
  <li>💡 Idea 2</li>
  <li>💡 Idea 3</li>
  <li>💡 Idea 4</li>
</ul>
<h2>Best Ideas:</h2>
<ol>
  <li>⭐ </li>
  <li>⭐ </li>
</ol>
<h2>Action Steps:</h2>
<ul>
  <li>Next step 1</li>
  <li>Next step 2</li>
</ul>`,
  },
];