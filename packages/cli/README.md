# @horn/cli

CLI tool for scaffolding and managing @horn/orpc-hono projects.

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
pnpm add -g @horn/cli

# Or use with npx (recommended)
npx @horn/cli create my-app
```

## Usage

### Create a New Project

```bash
# Interactive mode (recommended)
horn create

# With project name
horn create my-app

# With template flag (for future use)
horn create my-app --template beta
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
horn generate

# Or use aliases
horn g

# Generate a complete feature (controller + service + repository + contracts + schema)
horn generate feature user
horn g feature product

# Generate individual files
horn generate controller order
horn generate service payment
horn generate repository inventory
```

**For individual file generation**, you'll be prompted to select which feature/module to place the file in.

### Command Reference

```bash
horn create [project-name]          # Create new project
horn generate [type] [name]         # Generate code
horn g [type] [name]                # Alias for generate
horn --help                         # Show help
horn --version                      # Show version
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
horn g feature user
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
horn g controller payment

# Generate service
horn g service email

# Generate repository
horn g repository cache
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
