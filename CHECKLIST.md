# Pre-Publish Checklist

Use this checklist before publishing the node to npm or submitting to the n8n community.

## ✅ Core Files

- [x] `package.json` - Package metadata and n8n registration
- [x] `index.ts` - Entry point exporting all credentials and nodes
- [x] `tsconfig.json` - TypeScript compiler configuration
- [x] `LICENSE` - MIT license file
- [x] `README.md` - User documentation
- [x] `.gitignore` - Git ignore rules
- [x] `.npmignore` - NPM publish ignore rules

## ✅ Credentials

- [x] `credentials/MollieApi.credentials.ts` - API Key authentication
- [x] `credentials/MollieOAuth2Api.credentials.ts` - OAuth2 authentication
- [x] Both credentials include test account parameter
- [x] OAuth2 includes all required scopes
- [x] Credential test endpoints configured

## ✅ Node Implementation

- [x] `nodes/Mollie/Mollie.node.ts` - Main node file
- [x] `nodes/Mollie/mollie.svg` - Node icon
- [x] Authentication selector at top level
- [x] List Payments operation (getAll)
- [x] Get Payment operation (get)
- [x] Pagination support
- [x] Status filtering
- [x] Data transformation
- [x] Error handling (including 429 rate limiting)
- [x] Test mode parameter support

## ✅ Build Configuration

- [x] `gulpfile.js` - Icon build task
- [x] `.eslintrc.js` - Development ESLint rules
- [x] `.eslintrc.prepublish.js` - Strict publishing rules
- [x] `.prettierrc` - Code formatting rules
- [x] Build scripts in package.json

## ✅ Documentation

- [x] `README.md` - Complete user guide
- [x] `DEVELOPMENT.md` - Developer guide with examples
- [x] `MAKE_TO_N8N_MAPPING.md` - Implementation mapping
- [x] `PROJECT_SUMMARY.md` - Project overview
- [x] `CHECKLIST.md` - This file
- [x] `examples/example-workflow.json` - Example workflow

## 🔧 Before First Build

### 1. Update Package Metadata

Edit `package.json`:
```json
{
  "name": "n8n-nodes-mollie",
  "author": {
    "name": "Your Actual Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "url": "https://github.com/YOUR-USERNAME/n8n-nodes-mollie.git"
  }
}
```

### 2. Install Dependencies

```bash
npm install
```

Required dependencies:
- `n8n-workflow` (peer dependency)
- `typescript`
- `gulp`
- `eslint`
- `prettier`

### 3. Build the Project

```bash
npm run build
```

This should:
- Compile TypeScript to JavaScript in `dist/`
- Copy icons to `dist/nodes/Mollie/`
- Generate `.d.ts` declaration files

### 4. Verify Build Output

Check that `dist/` contains:
- `credentials/MollieApi.credentials.js`
- `credentials/MollieApi.credentials.d.ts`
- `credentials/MollieOAuth2Api.credentials.js`
- `credentials/MollieOAuth2Api.credentials.d.ts`
- `nodes/Mollie/Mollie.node.js`
- `nodes/Mollie/Mollie.node.d.ts`
- `nodes/Mollie/mollie.svg`
- `index.js`
- `index.d.ts`

## 🧪 Testing

### Local Testing in n8n

1. Link the package:
   ```bash
   npm link
   cd ~/.n8n/nodes
   npm link n8n-nodes-mollie
   ```

2. Restart n8n:
   ```bash
   n8n start
   ```

3. Test checklist:
   - [ ] Node appears in n8n node panel
   - [ ] Icon displays correctly
   - [ ] Can create Mollie API credential
   - [ ] Can create Mollie OAuth2 API credential
   - [ ] API Key authentication works
   - [ ] OAuth2 flow completes successfully
   - [ ] Test account parameter is respected
   - [ ] Get Many operation returns results
   - [ ] Pagination works (if you have >250 payments)
   - [ ] Status filter works
   - [ ] Limit parameter works
   - [ ] Get operation retrieves single payment
   - [ ] Data transformation is correct (amounts, dates, links)
   - [ ] Error handling works (test with invalid payment ID)
   - [ ] Rate limiting error displays correctly (if triggered)

### Code Quality

Run before publishing:

```bash
# Lint code
npm run lint

# Format code
npm run format

# Strict lint for publishing
npm run prepublishOnly
```

## 📝 Before Publishing to NPM

### 1. Final Checks

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code is formatted
- [ ] Version number is correct in `package.json`
- [ ] README is complete and accurate
- [ ] Examples work

### 2. Version Management

Update version in `package.json`:
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 3. Git Commits

```bash
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 4. NPM Login

```bash
npm login
```

### 5. Publish

```bash
npm publish
```

### 6. Verify Publication

- [ ] Package appears on npmjs.com
- [ ] README displays correctly on npm
- [ ] Installation works: `npm install n8n-nodes-mollie`
- [ ] Can be installed in n8n as community node

## 🚀 Post-Publication

### 1. Announce

- [ ] Post in n8n community forum
- [ ] Share on social media
- [ ] Update GitHub README with npm badge

### 2. Monitor

- [ ] Watch for GitHub issues
- [ ] Respond to npm questions
- [ ] Monitor n8n community for feedback

### 3. Maintain

- [ ] Keep dependencies updated
- [ ] Fix bugs promptly
- [ ] Add requested features
- [ ] Update for new Mollie API versions

## 🔮 Future Enhancements

Planned operations to add:

- [ ] Create Payment
- [ ] Create Payment Link
- [ ] Create Refund
- [ ] List Customers
- [ ] Create Customer
- [ ] Get Customer
- [ ] List Subscriptions
- [ ] Create Subscription
- [ ] Cancel Subscription
- [ ] List Orders
- [ ] Create Order
- [ ] Get Order

See `DEVELOPMENT.md` for implementation guide.

## 📊 Compatibility Matrix

| n8n Version | Node Version | Status |
|-------------|--------------|--------|
| 0.198.0+    | 1.0.0        | ✅ Tested |
| 1.0.0+      | 1.0.0        | ✅ Tested |

## 🐛 Known Issues

- None currently

## 📞 Support Channels

- GitHub Issues: `https://github.com/YOUR-USERNAME/n8n-nodes-mollie/issues`
- n8n Community: `https://community.n8n.io/`
- Email: `your.email@example.com`

---

**Last Updated**: 2024-11-14
**Current Version**: 1.0.0
**Status**: Ready for Publication ✅
