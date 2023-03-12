<div align="center">
  <h1>trpc-message-passing</h1>
  <a href="https://www.npmjs.com/package/trpc-message-passing"><img src="https://img.shields.io/npm/v/trpc-message-passing.svg?style=flat&color=brightgreen" target="_blank" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" /></a>
  <a href="https://trpc.io/discord" target="_blank"><img src="https://img.shields.io/badge/chat-discord-blue.svg" /></a>
  <br />
  <hr />
</div>

## **[Message Passing](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage/) support for [tRPC](https://trpc.io/)** 🧩

- Easy communication between iframes.
- Typesafe messaging between parent and child windows
- soon to be compatible with web workers

## Usage

**1. Install `trpc-message-passing`.**

```bash
# npm
npm install trpc-message-passing
# yarn
yarn add trpc-message-passing
# pnpm
pnpm add trpc-message-passing
```

**2. Add `createMessagePassingHandler` in your background script.**

```typescript
// background.ts
import { initTRPC } from "@trpc/server";
import { createMessagePassingHandler } from "trpc-message-passing/adapter";

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
});

const appRouter = t.router({
  // ...procedures
});

export type AppRouter = typeof appRouter;

createMessagePassingHandler({
  router: appRouter /* 👈 */,
});
```

**3. Add a `messagePassingLink` to the client in your content script.**

```typescript
// content.ts
import { createTRPCClient } from "@trpc/client";
import { messagePassingLink } from "trpc-message-passing/link";

import type { AppRouter } from "./background";

export const messagePassingClient = createTRPCClient<AppRouter>({
  links: [messagePassingLink({ frame: window, targetOrigin: "*" })], /* 👈 */,
});
```

## Requirements

Peer dependencies:

- [`tRPC`](https://github.com/trpc/trpc) Server v10 (`@trpc/server`) must be installed.
- [`tRPC`](https://github.com/trpc/trpc) Client v10 (`@trpc/client`) must be installed.

## Types

### MessagePassingLinkOption

Please see [full typings here](src/link/index.ts).

| Property           | Type       | Description                                               | Required |
| ------------------ | ---------- | --------------------------------------------------------- | -------- |
| `postMessage`      | `Function` | Called to send data to the "server".                      | `true`   |
| `addEventListener` | `Function` | Called add listener to receive request from the "server". | `true`   |

### CreateMessagePassingHandlerOptions

Please see [full typings here](src/adapter/index.ts).

| Property           | Type       | Description                                               | Required |
| ------------------ | ---------- | --------------------------------------------------------- | -------- |
| `router`           | `Router`   | Your application tRPC router.                             | `true`   |
| `postMessage`      | `Function` | Called to send data to the "client".                      | `true`   |
| `addEventListener` | `Function` | Called add listener to receive request from the "client". | `true`   |
| `createContext`    | `Function` | Passes contextual (`ctx`) data to procedure resolvers.    | `false`  |
| `onError`          | `Function` | Called if error occurs inside handler.                    | `false`  |

---

## License

Distributed under the MIT License. See LICENSE for more information.

## Contact

James Berry - Follow me on Twitter [@jlalmes](https://twitter.com/jlalmes) 💙
