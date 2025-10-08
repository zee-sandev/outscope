# @outscope/cli

CLI tool for scaffolding and managing @outscope/orpc-hono projects.

## Features

- 🚀 **Quick project scaffolding** with interactive prompts
- 📦 **Template-based** project creation
- 🔧 **Code generators** for features, controllers, services, and repositories
- ⚡ **Automatic dependency installation** (optional)
- 🗃️ **Prisma support** (optional)
- 📝 **Smart file transformations** - minimal string hardcoding

## Installation

```bash
# Install globally
pnpm add -g @outscope/cli

# Or use with npx (recommended)
npx @outscope/cli create my-app
```

## Usage

### Create a New Project

```bash
# Interactive mode (recommended)
outscope create
# Or use the short alias
osp create

# With project name
outscope create my-app

# With template flag (for future use)
outscope create my-app --template beta
```

**Interactive prompts:**
1. Project name
2. Template selection (currently: beta)
3. Include Prisma? (yes/no)
4. Install dependencies? (yes/no)
5. Initialize database? (yes/no, if Prisma selected)

### Generate Code

Generate features, controllers, services, or repositories:

```bash
# Interactive mode
outscope generate
# Or use the short alias
osp generate

# Or use the generate alias
outscope g
osp g

# Generate a complete feature (controller + service + repository + contracts + schema)
outscope generate feature user
osp g feature product

# Generate individual files
outscope generate controller order
osp generate service payment
osp generate repository inventory
```

**For individual file generation**, you'll be prompted to select which feature/module to place the file in.

### Command Reference

```bash
outscope create [project-name]      # Create new project
osp create [project-name]           # Short alias for create

outscope generate [type] [name]     # Generate code
osp generate [type] [name]          # Short alias for generate
osp g [type] [name]                 # Alias for generate

outscope --help                     # Show help
osp --help                          # Show help
outscope --version                  # Show version
osp --version                       # Show version
```

## Templates

Currently available templates:

- **beta** - Full-featured template with:
  - Hono + oRPC setup
  - Prisma ORM integration
  - Example Planet CRUD feature
  - OpenAPI documentation
  - Pino logger
  - Auto-controller loading

## Code Generators

### Feature Generator

Generates a complete feature module:

```bash
outscope g feature user
# Or using short alias
osp g feature user
```

Creates:
```
src/features/users/
  ├── user.controller.ts
  ├── user.service.ts
  ├── user.repository.ts
  └── index.ts
src/contracts/user.ts
src/schemas/user.ts
```

### Individual Generators

Generate specific files within existing features:

```bash
# Generate controller
outscope g controller payment
osp g controller payment

# Generate service
outscope g service email
osp g service email

# Generate repository
outscope g repository cache
osp g repository cache
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development mode (watch)
pnpm dev

# Type checking
pnpm check-types
```

## Template Structure

Templates are located in `src/templates/` and use symlinks to reference actual project templates in `apps/`.

Current structure:
```
src/templates/
  └── beta -> ../../../../apps/example-beta
```

## Architecture

- **commander** - CLI framework
- **inquirer** - Interactive prompts
- **ora** - Loading spinners
- **picocolors** - Terminal colors
- **execa** - Process execution
- **tsup** - TypeScript bundler

Files are copied from templates using Node.js `fs/promises` API with selective transformations for `package.json` and `README.md` only.

## License

MIT
