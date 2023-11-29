# Pages Action

<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

Deploy your [Cloudflare Pages](https://pages.cloudflare.com/) by GitHub Actions.

## Motivation

Cloudflare Pages' automatic git deployments are really powerful and easy to use. However, when you're working in monorepo, or if you just change README.md only, it may make you uncomfortable to trigger deployment. So I automated the deployment with GitHub Action, using Cloudflare v4 API.

This action request Cloudflare Pages to build the main branch and poll the response until all steps are finished. It provides a greater experience than simply calling deploy hooks because if you just call the deploy hooks, you cannot notice whether the build fails or not.

## Inputs

- `accountId` (required): Cloudflare Account ID. See: https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/
- `projectName` (required): Name of the Pages project.
- `token` (required): Authorization token of Cloudflare.
- `interval` (optional): Interval (ms) for polling. Default is `3000`.
- `branch` (optional): Name of a branch to deploy. If it isn't provided, the production branch will be chosen.

## Usage

```yaml
name: Publish page

on:
  push:
    # It deploys when the main branch changes only.
    branches: [main]
    # It deploys when the following files/directories are changed only.
    paths:
      - packages/pages/**
      - .github/workflows/publish-page.yml

jobs:
  publish:
    name: Publish to Cloudflare Pages
    runs-on: ubuntu-latest
    steps:
      - name: Deploy pages
        uses: SeokminHong/pages-action@v0.6
        with:
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: {{ page_name }}
          token: ${{ secrets.CLOUDFLARE_TOKEN }}
          branch: dev
```
