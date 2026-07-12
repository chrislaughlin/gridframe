# Framework-neutral server package

Gridframe exposes reusable backend behavior through `@gridframe/server`: Fetch-native handlers plus repository, Card library, Dashboard seed, and Card data resolver interfaces. We chose this boundary instead of shipping a supported database adapter in v1 so consumers can keep their own persistence model while Gridframe owns Dashboard API contracts, mutation rules, layout validation, and typed errors.
