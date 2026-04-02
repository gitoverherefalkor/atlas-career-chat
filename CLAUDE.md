# Atlas Assessments Project

## Project overview
Atlas Assessments is a career guidance platform for professionals aged 18-55 (primarily college-educated, office jobs). Users complete a custom survey, and an AI system (via n8n workflows) analyzes their responses to provide personality assessments and detailed career recommendations based on their goals, personality, and skills. Users can discuss results through an AI chat and incorporate feedback into a final report.

Current development focus: building out the platform features and establishing n8n workflow connections.

## Developer profile
- **Background**: Project manager with AI workflow expertise
- **Coding level**: Non-technical "vibe coder" learning terminology
- **Needs**: Clear explanations, visual confirmation of changes, guidance on technical decisions
- **Working style**: Collaborative, needs AI to take the reigns but explain what's happening

## Communication guidelines
- Use business casual tone, avoid excessive formality
- Keep explanations simple but not condescending
- Explain technical concepts when introducing new patterns or tools
- Challenge assumptions if something seems off
- For LARGE changes or new features: provide a recap of what you understand and what you'll do, wait for confirmation, then execute
- For small changes: just do it and push so changes can be tested visually
- No need for disclaimers or "I'm just an AI" statements
- Be honest when you don't know something

## Development commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `git status`: Check git status
- `git add .`: Stage all changes
- `git commit -m "message"`: Commit changes
- `git push`: Push to GitHub

## Installed software
- VS Code (for visualization)
- Docker
- Homebrew
- Postman
- Terminal (zsh)
- Git/GitHub
- Node.js and npm

## File boundaries
**Safe to edit:**
- `/src/` - All source code files
- `/public/` - Public assets
- `/supabase/` - Supabase functions and migrations
- `/mocks/` - Mock data files
- Documentation files

**Never touch:**
- `/node_modules/`
- `/dist/`
- `/.git/`
- Package lock files (unless explicitly updating dependencies)

## Tech stack
- React with TypeScript
- Supabase (database and auth)
- Vite (build tool)
- Tailwind CSS
- n8n (external workflow automation)

## Coding standards
- Write clean, readable code
- Add comments for complex logic
- Use TypeScript types properly
- Follow existing code patterns in the project
- Test changes visually in the browser

## Git workflow
- Commit frequently with clear messages
- Push changes after major features or fixes
- Always check `git status` before committing
- Use descriptive commit messages (not "update" or "fix")

## Before starting large changes
1. Explain what you understand from the request
2. Outline your approach
3. Wait for confirmation
4. Execute and push changes
5. Summarize what was changed

## n8n integration notes
- n8n handles the AI assessment workflows
- Platform needs to send survey data to n8n
- Platform needs to receive assessment results from n8n
- Consider webhook endpoints and API connections

## n8n API access
- **Instance**: https://falkoratlas.app.n8n.cloud
- **API Key**: stored in `.env` as `N8N_API_KEY`
- **Auth header**: `X-N8N-API-KEY`
- **Usage**: `curl -s -H "X-N8N-API-KEY: $(grep N8N_API_KEY .env | cut -d'"' -f2)" https://falkoratlas.app.n8n.cloud/api/v1/workflows`
- **Capabilities**: List/get/update workflows, check executions, activate/deactivate
- **Important**: Never modify n8n workflows or question mappings without explicit approval
- **Workflow exports**: JSON backups are in `n8n_aa/` folder

### Workflow IDs (current architecture)
| Workflow | ID | Purpose |
|----------|-----|---------|
| WF1 (Profile Insert) | nupGvBByAGh4A9tL | Survey → personality profile |
| WF2 (Enrich 15) | vVv0tsnFlBnarMdq | Career research + AI impact |
| WF3 (Scoring + OOB) | LJA5JPHvnqhA36Oh | Career scoring + outside-the-box |
| WF4 (Content Gen) | pXlzC6vuG7TO28oQ | Top 3 + runner-up + dream job narratives |
| WF5 (Chat) | h7ie9zN080IM2g7N | Interactive career coach chat |
| Error Handler | FbsruPbuZI2Fgtc8 | Global error logging + email alerts |
| Resume Extract | myWIhgaahAXD2ULz | PDF resume parsing |