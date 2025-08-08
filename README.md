# Figma Story Plugin

A revolutionary Storybook-to-Figma synchronization tool that preserves design tokens as Figma variables, enabling true design-code parity.

## 🚀 Features

- **Variable-First Architecture**: Preserves design tokens as Figma variables instead of static values
- **Bidirectional Sync**: Sync changes from code to design and design to code
- **Multi-Theme Support**: Automatically converts themes to Figma modes
- **Semantic Preservation**: Maintains token relationships and inheritance
- **Developer-First**: CLI tool for CI/CD integration with Git-based version control

## 📋 Project Status

**Current Status: Foundation Complete** ✅

The project has successfully completed its initial foundation phase and is ready for the next development iteration.

### ✅ Completed Foundation (Phase 1)
- [x] Repository setup with monorepo structure
- [x] Basic Figma plugin scaffold (`packages/figma-plugin/`)
- [x] Storybook addon boilerplate (`packages/storybook-addon/`)
- [x] WebSocket communication layer scaffold (`packages/bridge/`)
- [x] Parser foundation (`packages/parser/`)
- [x] Shared utilities and types (`packages/shared/`)

### 🚧 Current Phase: Core Implementation (Weeks 2-8)
- [ ] CSS variable detection implementation
- [ ] Token parsing and extraction
- [ ] Figma variable creation API integration
- [ ] Real-time synchronization between Storybook and Figma
- [ ] Basic color token support
- [ ] Component import functionality

### 📊 Progress Overview
- **Architecture**: 100% Complete
- **Scaffolding**: 100% Complete  
- **Core Features**: 0% Complete
- **Testing Setup**: In Progress

## 🛠️ Technology Stack

- **Frontend**: TypeScript, React (Storybook addon)
- **Figma Plugin**: TypeScript, Figma Plugin API
- **Parser**: PostCSS for CSS analysis, Babel for JS/TS AST
- **Communication**: WebSocket for real-time sync
- **Build Tools**: pnpm workspaces for monorepo management

## 📁 Project Structure

```
figma-story-plugin/
├── packages/
│   ├── storybook-addon/    # Storybook addon for token extraction
│   ├── figma-plugin/        # Figma plugin for variable creation
│   ├── parser/              # Token parsing and analysis
│   ├── bridge/              # WebSocket communication layer
│   └── shared/              # Shared types and utilities
├── docs/                    # Documentation
└── examples/                # Example implementations
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Figma Desktop App
- Storybook 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/figma-story-plugin.git

# Install dependencies
cd figma-story-plugin
pnpm install

# Start development
pnpm dev
```

## 🎯 Key Differentiators

1. **First to preserve design tokens** as Figma variables rather than static values
2. **Bidirectional synchronization** between code and design
3. **Multi-theme intelligence** with automatic Figma mode generation
4. **Developer-first approach** with CLI tools and Git integration

## 📊 Market Comparison

| Feature | Our Solution | story.to.design | storybook-to-figma |
|---------|-------------|-----------------|-------------------|
| Variable Support | ✅ Full | ❌ None | ❌ None |
| Bidirectional Sync | ✅ Yes | ❌ One-way | ❌ One-way |
| Price | $29-79/month | $149/month | Free (Beta) |
| Token Preservation | ✅ Yes | ❌ No | ❌ No |

## 🗓️ Updated Roadmap

### Phase 1: Core Implementation ⏳ (Current - Weeks 2-8)
- CSS variable detection and parsing
- Basic color token synchronization
- Figma variable creation API
- Real-time WebSocket communication
- Simple component import

### Phase 2: Enhanced Token Support (Weeks 9-14)
- Typography and spacing variables
- Complex token relationships and references
- Multi-theme and mode support
- Component variant mapping
- Auto-layout detection

### Phase 3: Production Features (Weeks 15-20)
- Error handling and conflict resolution
- Performance optimization
- Advanced parsing (CSS custom properties, JS tokens)
- Plugin UI/UX improvements

### Phase 4: Bidirectional & Enterprise (Weeks 21+)
- Figma to code synchronization
- Git integration and version control
- Analytics and usage insights
- SSO integration for enterprise
- Self-hosted deployment options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://figma-variables.dev) (Coming Soon)
- [Product Development Plan](STORYBOOK_FIGMA_VARIABLES_PLAN.md)
- [Discord Community](https://discord.gg/figma-variables) (Coming Soon)

## 📧 Contact

For questions and support, please open an issue on GitHub or reach out via:
- GitHub Issues: [Report a bug](https://github.com/yourusername/figma-story-plugin/issues)
- Email: support@figma-variables.dev (Coming Soon)

---

**"Don't just sync components - preserve your design decisions"**

Built with ❤️ for the design systems community