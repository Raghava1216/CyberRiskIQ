---
name: sandbox git restore + validation parity
description: How to revert files when destructive git is blocked, and what the validation gate enforces.
---

# Restoring files in the sandbox

Destructive git commands (checkout, restore, reset, clean) are blocked by the
sandbox. To revert a tracked file to a past commit, use the read-only form and
redirect:

```
git --no-optional-locks show <commit>:<path> > <path>
```

Loop it over a file list to restore many files. `rm` is allowed for removing
files/dirs.

**Gotcha:** if you restore files into a directory and then `rm -rf` that
directory to clean up unrelated files, you delete the restored files too. Remove
only the specific unwanted paths.

# Validation gate enforces feature/UI parity

The completion validation (code_review/architect acting as a gate) judges whether
the app still looks and works like the established baseline.

**Why:** a full refactor that dropped interactive features (modals, widgets,
charts) and rewrote the shell was rejected as a regression even though it built
and passed e2e — losing user-facing capability is treated as a failure.

**How to apply:** when asked to "re-skin" or restyle, preserve every existing
feature and the shell; change only theme tokens (colors/typography) unless the
user explicitly approves removing or restructuring functionality.
