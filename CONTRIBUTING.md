# Contributing

Thank you for your interest in contributing to Inertia.js! Your contributions help make this project better for everyone.

Inertia.js is maintained as a monorepo using [pnpm workspaces](https://pnpm.io/workspaces). Below you'll find an overview of the repository and how to get your development environment running.

> **Note:** You'll need **pnpm version 10 or higher**. If you're unsure which version you have, run `pnpm -v`.

## Repository Overview

```
inertia/
├── packages/          Core libraries and framework adapters
│   ├── core/          Framework-agnostic core library
│   ├── react/         React adapter
│   │   └── test-app/  React test application
│   ├── svelte/        Svelte adapter
│   │   └── test-app/  Svelte test application
│   └── vue3/          Vue 3 adapter
│       └── test-app/  Vue 3 test application
├── playgrounds/       Full Laravel applications for manual testing
│   ├── react/         Laravel + React
│   ├── svelte5/       Laravel + Svelte 5
│   └── vue3/          Laravel + Vue 3
└── tests/             End-to-end tests and test server
    ├── app/           Shared Node.js backend
    └── *.spec.ts      Playwright test suite
```

### Key Components

- **Core Library:** The framework-agnostic engine powering all adapters (`packages/core`).
- **Adapters:** Framework-specific integrations for React, Svelte, and Vue.
- **Test Applications:** Minimal frontend apps used for automated testing (`packages/*/test-app/`).
- **Playwright Tests:** Framework-agnostic end-to-end tests that verify behavior across adapters (`tests/*.spec.ts`).
- **Playgrounds:** Full Laravel applications for manual testing (`playgrounds/`). These are optional and may eventually be removed.

## Getting Started

Clone the repository and install the dependencies:

```sh
git clone https://github.com/buhrmi/inertiax.git inertia
cd inertia
pnpm install
```

Then, start the development environment:

```sh
pnpm dev
```

This builds the core library and remaining packages, and starts a file watcher that will automatically rebuild each package when changes are made.

If you prefer, you can also start individual watchers from each package directory. For example:

```sh
cd packages/core && pnpm dev
cd packages/svelte && pnpm dev
```

> **Note:** The core package (`packages/core`) must always be running, as all adapters depend on it.

## Running Tests

Inertia.js uses Playwright to run a shared end-to-end test suite against the Svelte adapter.

Run the test suite:

```sh
pnpm test:svelte
```

This command automatically sets a `PACKAGE` environment variable that tells the Node.js test server which adapter to serve.

If you want to run Playwright directly, you can pass the environment variable yourself:

```sh
PACKAGE=svelte playwright test
```

You may filter tests by name:

```sh
pnpm test:svelte -g "partial reload"
```

Run tests in headed mode (to see the browser):

```sh
pnpm test:svelte --headed
```

Or in debug mode:

```sh
pnpm test:svelte --debug
```

### How the Test Setup Works

The test setup uses the same Node.js backend and Playwright test suite.

```
tests/app/server.js         Shared Node.js backend
└── serves: svelte test app (when PACKAGE=svelte)

tests/*.spec.ts             Shared Playwright test suite
```

When running a test command, the correct adapter is selected automatically:

| Adapter | `PACKAGE` value | Test server port | App URL                                            |
| ------- | --------------- | ---------------- | -------------------------------------------------- |
| Svelte  | `svelte`        | 13717            | [http://localhost:13717/](http://localhost:13717/) |

### Automatic Test Server Boot

You do not need to start the test server manually. When you run a test, Playwright automatically builds the frontend for the selected adapter and boots the Node.js test server before running the tests. This is configured in the Playwright config (`playwright.config.ts`) using the [`webServer`](https://playwright.dev/docs/test-configuration#webserver) option. If a server is already running (for example, during local development), Playwright will reuse it.

## Running Test Applications

The test applications are the primary development environments for Inertia.js. These minimal apps cover all supported features and are used for both manual development and automated end-to-end testing.

Run the test app:

```sh
pnpm dev:test-app
```

Or start it directly:

```sh
pnpm dev:test-app:svelte
```

Each test app runs two servers:

- A Node.js backend that automatically restarts when changed
- A Vite development server for the frontend

If you are developing a new feature or fixing a bug, you can use these test apps to develop and test your changes.

## Adding Tests

If you are fixing a bug, adding a feature, or improving existing functionality, please verify behavior in the Svelte test app.

### 1. Add Frontend Pages

Create the frontend page in the Svelte test application:

```
packages/svelte/test-app/Pages/YourFeature.svelte
```

### 2. Add Backend Routes (If Needed)

If your change requires a backend route, add it to the shared Node.js test server:

```javascript
// tests/app/server.js
app.get('/your-feature', (req, res) =>
  inertia.render(req, res, {
    component: 'YourFeature',
    props: { foo: 'bar' },
  }),
)
```

### 3. Write a Playwright Test

Add a new Playwright test to verify your change.

```typescript
// tests/your-feature.spec.ts
import { test, expect } from '@playwright/test'

test('your feature works', async ({ page }) => {
  await page.goto('/your-feature')
  // Your assertions here
})
```

### 4. Run the Tests

Be sure to run your test:

```sh
pnpm test:svelte -g "your feature"
```

## Using the Playgrounds (Optional)

The repository also includes several full Laravel applications that integrate Inertia.js. These are optional and mostly useful for manually exploring how Inertia works inside a real Laravel app.

The playgrounds are provided as-is and are not part of the automated test setup. They may be removed in the future.

### Getting Started

To start a playground, simply run:

```sh
pnpm playground:svelte
```

The playground script will automatically handle initial setup if needed:

- Installing PHP dependencies via Composer
- Installing Node.js dependencies via pnpm
- Creating the `.env` file from `.env.example`
- Generating the application key
- Setting up the SQLite database
- Running migrations with seed data

Visit the application at [http://127.0.0.1:8000](http://127.0.0.1:8000).

Each playground has its own pnpm script:

```sh
pnpm playground:svelte
```

## Publishing (Maintainers Only)

Releasing is handled by the included release script. You'll need both the `git` CLI and the GitHub CLI ([`gh`](https://cli.github.com)) installed. To create a new release:

```sh
./release.sh
```

The script will:

- Ensure you're on the master branch with a clean working tree
- Prompt you to select the type of version bump (patch, minor, or major)
- Update all package versions automatically
- Update the lockfile
- Create a git commit and tag
- Push changes and tags to GitHub
- Create a GitHub release with auto-generated notes
- Trigger the CI publishing workflow

Publishing is handled securely using GitHub + npm [trusted publishing](https://docs.npmjs.com/trusted-publishers).
