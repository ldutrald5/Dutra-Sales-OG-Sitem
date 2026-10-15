# DUTRA synchronous glob adapter

Local original adapter for the observed AIOX 5.4.1 consumers. It replaces the
implementation, not the version number of upstream fast-glob. It uses glob 10.5.0
and contains no braces/micromatch dependency or copied parser.

Supported API: `.sync(patterns, options)`, returning unique portable file paths.
Options: cwd, onlyFiles (default true), absolute, dot (default false), unique
(true only), ignore (array), followSymbolicLinks (default true). Unknown options
throw rather than silently weakening behavior. Async/stream/stat APIs are not
implemented and are not used by the pinned consumers.

Patterns/ignore are bounded to 4096 characters and 32 nested brace/parenthesis
groups in total (independent counters per type) before reaching the backend.
These bounds limit deeply nested inputs; they do not make arbitrary untrusted
glob expressions universally safe.

Ordering is breadth-first then lexical. Actual consumers and
fixtures must pass differential tests before this adapter can be accepted.
This is not a general compatibility promise for arbitrary future AIOX versions.

Install local packages with `install-links=true` so independent nested installs
resolve their own dependencies. AIOX's upstream installer can overwrite the nested
manifest; audit and restore the reviewed manifest after rebootstrap. Never assume
an upstream/global AIOX installation is covered by this project's overrides.
