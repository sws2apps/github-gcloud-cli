# GitHub GCloud CLI

A quickest way to setup the keyless authentication to Google Cloud from GitHub Action. We internally use the `gcloud` CLI to make this setup much easier. The detailed steps which our CLI is handling are found on this page: [Setting up Workload Identity Federation](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation).

## Install

```bash
npm i -g @sws2apps/github-gcloud-cli
```

## Usage

Run the CLI by typing the following in the terminal:

```bash
github-gcloud setup
```
