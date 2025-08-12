# AI Task Manager - MVP PRD

## Product Vision
A simple, AI-powered task manager that helps users manage their daily tasks with intelligent breakdown and planning assistance.

## Core User Flow

### Primary Use Case
1. **Task Entry**: User adds tasks to a simple list
2. **AI Task Breakdown**: User clicks "Break Down" to get AI-generated subtasks
3. **AI Day Planning**: User clicks "Plan My Day" to get an optimized schedule

## MVP Features

### 1. Task List (Core)
- Simple list interface showing all tasks
- Add new task with text input
- Mark tasks as complete/incomplete
- Delete tasks

### 2. AI Task Breakdown
- "Break Down" button for each task
- AI analyzes the task and suggests 3-5 actionable subtasks
- User can accept, edit, or reject suggestions
- Subtasks become new items in the main list

### 3. AI Day Planner
- "Plan My Day" button (global action)
- AI considers all pending tasks and suggests:
  - Priority order
  - Time estimates
  - Optimal scheduling
- Simple text output with reasoning

## User Interface Flow

```
Main Screen:
┌─────────────────────────────────┐
│ ✚ Add Task                      │
│ [Plan My Day] 🤖                │
├─────────────────────────────────┤
│ □ Task 1 [Break Down] 🤖        │
│ ☑ Task 2 (completed)            │
│ □ Task 3 [Break Down] 🤖        │
└─────────────────────────────────┘
```

## Technical Requirements
- Next.js app with simple state management
- AI integration (OpenAI/Claude API)
- Local storage for persistence
- Responsive design for mobile/desktop

## Success Metrics
- User can add and manage basic tasks
- AI breakdown provides useful, actionable subtasks
- Day planning helps users feel more organized
- Simple, intuitive interface with minimal learning curve

## Out of Scope (Future)
- User accounts/authentication
- Task sharing/collaboration
- Advanced scheduling/calendar integration
- Complex project management features
- Notifications/reminders
