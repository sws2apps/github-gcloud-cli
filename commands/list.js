import chalk from 'chalk';
import { execSync } from 'child_process';
import confirm from '@inquirer/confirm';
import input from '@inquirer/input';

export const setupWIF = async () => {
	try {
		console.log(
			chalk.green(
				'\nWelcome to GitHub GCloud CLI\nThis tool will help you to setup the Workload Identity Federation in Google Cloud for GitHub Action\n'
			)
		);

		console.log(
			chalk.blue(
				'Before continuing, make sure that the Google Cloud SDK is installed in your workstation (https://cloud.google.com/sdk/docs/install-sdk), and the necessary project exists in the Google Cloud Console (https://console.cloud.google.com).\n'
			)
		);

		const answer = await confirm({ message: 'Are you sure to continue?' });

		if (!answer) {
			return;
		}

		console.log('\nAuthenticating...');
		// execSync('gcloud auth login', { stdio: [] });
		console.log(chalk.green('You are now connected to the Google Cloud SDK.'));

		console.log('\n');
		const projectId = await input({
			message:
				'Enter the ID of the project you want to setup on Google Cloud: ',
		});

		if (!projectId) {
			console.log(
				chalk.red('You did not provide the Project ID which is required')
			);
			return;
		}

		const PROJECT_ID = projectId.toLowerCase();

		const serviceAccountName = await input({
			message:
				'How do you want to call the Google Cloud Service Account that will be created?',
			default: 'github-service-account',
		});
		const SERVICE_ACCOUNT = `${serviceAccountName}@${PROJECT_ID}.iam.gserviceaccount.com`;

		console.log('\nCreating Google Cloud Service Account ...');

		// check if the service account exists
		const accountsList = execSync(
			`gcloud iam service-accounts list --project "${PROJECT_ID}"`
		);
		const accountExist = accountsList.toString().includes(SERVICE_ACCOUNT);

		if (accountExist) {
			console.log(
				chalk.yellow(
					`GitHub Service Account already exists! If necessary, grant the ${SERVICE_ACCOUNT} the necessary permissions to access Google Cloud resources, in the IAM Admin page(https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}). This step varies by use case.`
				)
			);
		}

		if (!accountExist) {
			execSync(
				`gcloud iam service-accounts create "${SERVICE_ACCOUNT}" --name="${serviceAccountName}" --display-name="Keyless authentication for GitHub Action" --project "${PROJECT_ID}"`,
				{ stdio: [] }
			);

			console.log(
				chalk.green(
					`GitHub Service Account created successfully! Grant the ${SERVICE_ACCOUNT} the necessary permissions to access Google Cloud resources, in the IAM Admin page(https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}). This step varies by use case.`
				)
			);
		}

		const IAM_SERVICE = 'iamcredentials.googleapis.com';

		console.log('\nEnabling the IAM Credentials API ...');
		const enabledServicesList = execSync(
			`gcloud services list --enabled --project "${PROJECT_ID}"`
		);

		const isServiceEnabled = enabledServicesList
			.toString()
			.includes(IAM_SERVICE);

		if (isServiceEnabled) {
			console.log(chalk.yellow(`Service already enabled`));
		}

		if (!isServiceEnabled) {
			execSync(
				`gcloud services enable ${IAM_SERVICE} --project "${PROJECT_ID}"`,
				{ stdio: [] }
			);
			console.log(chalk.green(`Done!`));
		}

		const POOL_NAME = 'github-pool';

		console.log('\nCreating a Workload Identity Pool ...');
		const poolsList = execSync(
			`gcloud iam workload-identity-pools list --project="${PROJECT_ID}" --location="global"`
		);
		const poolExist = poolsList.toString().includes(POOL_NAME);

		if (poolExist) {
			console.log(
				chalk.yellow(`The Identity Pool for GitHub Action already exists.`)
			);
		}

		if (!poolExist) {
			execSync(
				`gcloud iam workload-identity-pools create "${POOL_NAME}" --project="${PROJECT_ID}" --location="global" --display-name="GitHub Action Pool"`,
				{ stdio: [] }
			);
			console.log(chalk.green(`Done!`));
		}

		const WORKLOAD_IDENTITY_POOL_ID = execSync(
			`gcloud iam workload-identity-pools describe "${POOL_NAME}" --project="${PROJECT_ID}" --location="global" --format="value(name)"`
		)
			.toString()
			.trim();

		const PROVIDER_NAME = 'github-action-provider';

		console.log(`\nCreating a Workload Identity Provider in ${POOL_NAME} ...`);
		const providersList = execSync(
			`gcloud iam workload-identity-pools providers list --project="${PROJECT_ID}" --workload-identity-pool="${POOL_NAME}" --location="global"`
		);
		const providerExist = providersList.toString().includes(PROVIDER_NAME);

		if (providerExist) {
			console.log(
				chalk.yellow(
					`The Provider in ${POOL_NAME} for GitHub Action already exists.`
				)
			);
		}

		if (!providerExist) {
			execSync(
				`gcloud iam workload-identity-pools providers create-oidc "github-action-provider" --project="${PROJECT_ID}" --location="global" --workload-identity-pool="${POOL_NAME}" --display-name="GitHub Action Provider" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" --issuer-uri="https://token.actions.githubusercontent.com"`,
				{ stdio: [] }
			);
			console.log(chalk.green(`Done!`));
		}

		console.log(
			`\nAllow authentication from GitHub to impersonate the Service Account ...\n`
		);

		const REPO_NAME = await input({
			message: 'Provide the GitHub repository path (orgs/repo or user/repo):',
		});

		if (!REPO_NAME) {
			console.log(chalk.red(`Repository information required`));
			return;
		}

		const policiesList = execSync(
			`gcloud iam service-accounts get-iam-policy "${SERVICE_ACCOUNT}" --project="${PROJECT_ID}" --format=json`
		);

		const userMember = `principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO_NAME}"`;
		const roleWorkflow = 'roles/iam.workloadIdentityUser';

		const workloadIdentityUsers =
			JSON.parse(policiesList.toString()).bindings.find(
				(policy) => policy.role === roleWorkflow
			).members || [];

		const isMemberExist = workloadIdentityUsers.find((user) =>
			user.includes(
				`${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO_NAME}`
			)
		)
			? true
			: false;

		if (isMemberExist) {
			console.log(chalk.yellow(`\nAccount already setup to be impersonated.`));
		}

		if (!isMemberExist) {
			execSync(
				`gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" --project="${PROJECT_ID}" --role=${roleWorkflow} --member=${userMember}`,
				{ stdio: [] }
			);
			console.log(chalk.green(`\nAccount setup completed!`));
		}

		const WORKLOAD_IDENTITY_PROVIDER = execSync(
			`gcloud iam workload-identity-pools providers describe "${PROVIDER_NAME}" --project="${PROJECT_ID}" --location="global" --workload-identity-pool="${POOL_NAME}" --format="value(name)"`
		)
			.toString()
			.trim();

		console.log(
			chalk.green(
				`\nTo complete, add the following secrets to the ${REPO_NAME} GitHub repository:\n\nname: WORKLOAD_IDENTITY_PROVIDER (depends on your CI system)\nvalue: ${WORKLOAD_IDENTITY_PROVIDER}\n\nname: SERVICE_ACCOUNT (depends on your CI system)\nvalue: ${SERVICE_ACCOUNT}`
			)
		);
	} catch (error) {
		console.log(chalk.red(`\nAn error occured: ${error.message}`));
	}
};
