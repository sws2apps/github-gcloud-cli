# GitHub GCloud CLI

A quickest way to setup the keyless authentication to Google Cloud from GitHub Action. We internally use the `gcloud` CLI to make this setup much easier. The detailed steps which our CLI is handling are found on this page: [Setting up Workload Identity Federation](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation).

## Usage

Run the CLI by typing the following in the terminal:

```bash
npx @sws2apps/github-gcloud-cli setup
```
![img1](https://user-images.githubusercontent.com/26148770/192100883-5edd547d-22f5-4bc8-9324-c3266da44c0d.png)

A browser window will now open, and asks you to authenticate to the Google Cloud SDK. Complete the authentication in that window, and the CLI window will use the authentication token it gets:

![img2](https://user-images.githubusercontent.com/26148770/192100980-6ed6efe9-811b-480b-9996-15e8a657cd80.png)

Provide the `PROJECT_ID` and the service account name to be created (if not provided, `github-service-account` will be used):

![img3](https://user-images.githubusercontent.com/26148770/192101000-38bc61d3-e5ba-401b-8d60-f44022825e42.png)

A set of commands will be executed in the terminal to complete the Workload Identity Federation setup:

![img5](https://user-images.githubusercontent.com/26148770/192101270-7c184a50-5fe6-4fc7-9146-a21bc5690c3e.png)

Finally, add the two secrets generated at the end to corresponding GitHub repository:

![img6](https://user-images.githubusercontent.com/26148770/192101372-c4380056-dd0b-4924-9139-db715d00f415.png)

## Note

**DO NOT FORGET** to add the necessary permissions to the service account created in the Google Cloud Console.
