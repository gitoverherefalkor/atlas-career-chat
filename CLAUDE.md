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