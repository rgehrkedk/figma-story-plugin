# Figma Story Plugin

A revolutionary Storybook-to-Figma synchronization tool that preserves design tokens as Figma variables, enabling true design-code parity.

## 🚀 Features

- **Variable-First Architecture**: Preserves design tokens as Figma variables instead of static values
- **Bidirectional Sync**: Sync changes from code to design and design to code
- **Multi-Theme Support**: Automatically converts themes to Figma modes
- **Semantic Preservation**: Maintains token relationships and inheritance
- **Developer-First**: CLI tool for CI/CD integration with Git-based version control

## 📋 Project Status

This project is currently in early development. See our [Development Plan](STORYBOOK_FIGMA_VARIABLES_PLAN.md) for the complete roadmap.

### Current Phase: MVP Development (Weeks 1-6)
- [ ] Repository setup with monorepo structure
- [ ] Basic Figma plugin scaffold
- [ ] Storybook addon boilerplate
- [ ] WebSocket communication layer
- [ ] CSS variable detection in Storybook
- [ ] Token to Figma variable mapping

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

## 🗓️ Roadmap

### Phase 1: MVP (Current)
- Basic variable preservation
- Color token support
- Simple component import

### Phase 2: Enhanced Conversion
- Auto-layout detection
- Typography and spacing variables
- Component variants

### Phase 3: Bidirectional Sync
- Figma to code synchronization
- Git integration
- Conflict resolution

### Phase 4: Enterprise Features
- Analytics and insights
- SSO integration
- Self-hosted deployment

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