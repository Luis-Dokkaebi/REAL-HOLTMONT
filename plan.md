1. Remove the condition `else if (typeof rawVal === 'number' && Math.abs(rawVal - 1) < 0.001)` from the `isComplete` logic in `internalBatchUpdateTasks` in `CODIGO.js`. This is causing tasks with 1% progress to be falsely evaluated as 100% complete.
2. Ensure the same condition is removed from `Reverse Sync` checking logic (`isDone`) in `apiUpdateTask` in `CODIGO.js` if it exists.
3. Review any test files (e.g. `check_html2.js`) to ensure nothing breaks.
4. Call `pre_commit_instructions` and complete pre commit steps.
5. Use `submit` to commit the change.
