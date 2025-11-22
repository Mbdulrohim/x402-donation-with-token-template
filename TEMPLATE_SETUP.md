# Creating a Vercel Template

Your repository is now configured as a Vercel template! Here's what you need to do:

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure as Vercel template"
git push origin main
```

## Step 2: Make Repository Public (Required)

Vercel templates must be in a public repository:

1. Go to your GitHub repository
2. Click **Settings**
3. Scroll to the bottom → **Danger Zone**
4. Click **Change visibility** → **Make public**

## Step 3: Test the Deploy Button

The deploy button in README.md will now work:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMbdulrohim%2Fx402-donation-with-token-template)
```

## Step 4: Submit to Vercel Templates (Optional)

To appear in Vercel's official template gallery:

1. Go to https://vercel.com/templates
2. Click **Submit Template**
3. Enter your repository URL
4. Fill out the form with:
   - **Name**: X402 Token Donation Platform
   - **Description**: A Next.js template for creating a token donation platform powered by X402 payments on Solana
   - **Demo URL**: Your live demo (if available)
   - **Categories**: Web3, Payments, Social

## Files Created for Template

- ✅ `.vercel/project.json` - Project configuration
- ✅ `vercel.json` - Build and deployment settings
- ✅ `.github/vercel-template.json` - Template metadata
- ✅ `DEPLOY.md` - Deployment instructions
- ✅ `.env.example` - Environment variables guide
- ✅ Updated `README.md` - With deploy button

## Usage

Users can now deploy your template by:

1. Clicking the "Deploy with Vercel" button
2. Connecting their GitHub account
3. Filling in environment variables
4. Waiting for deployment

## Environment Variables Setup

The template automatically prompts for these variables during deployment:

**Required:**

- Database URL (Neon Postgres)
- Resource Server Wallet Address
- Resource Server Keypair (Base58 encoded)
- Token Configuration (mint, name, symbol, etc.)
- Solana Network Settings

See `.env.example` for the complete list.

## Post-Deployment Steps

Users will need to:

1. Run database migrations: `pnpm drizzle-kit push`
2. Fund the resource server wallet with tokens
3. Test the mint and donate functionality

See `DEPLOY.md` for detailed user instructions.

## Demo Site

Consider deploying a demo site so users can see it in action before deploying their own.

## Questions?

- Check the documentation in `README.md` and `DEPLOY.md`
- Open an issue on GitHub
- Review the Vercel template documentation: https://vercel.com/docs/templates
