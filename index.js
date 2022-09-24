#! /usr/bin/env node

import { program } from 'commander';
import { setupWIF } from './commands/list.js';

program
	.command('setup')
	.description(
		'Setup Workload Identity Federation in Google Cloud for GitHub Actions'
	)
	.action(setupWIF);

program.parse();
