#!/usr/bin/env node

/**
 * Content Buddy POC Application Entry Point
 * Integrates all production utilities and provides CLI interface
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { ConfigManager } from './src/utils/configManager.js';
import { ErrorHandling } from './src/utils/errorHandling.js';
import { Observability } from './src/utils/observability.js';
import { Monitoring } from './src/utils/monitoring.js';
import { ProviderManager } from './src/utils/providerManager.js';
import { TemplateManager } from './src/utils/templateManager.js';
import { ContentBuddy } from './src/ContentBuddy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InteractiveMenu {
  constructor(app) {
    this.app = app;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  // Helper method to scan for available input files
  scanInputFiles() {
    const inputFiles = [];
    const contentDirs = [
      'my_content',
      'golden_set/repurposing',
      'golden_set/transcripts',
      'golden_set/performance',
      'golden_set/briefs',
      'golden_set/domain_specific',
      'golden_set/edge_cases',
    ];

    for (const dir of contentDirs) {
      const fullPath = path.resolve(dir);

      try {
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);

          for (const file of files) {
            const filePath = path.join(fullPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
              const ext = path.extname(file).toLowerCase();
              // Include common content file types
              if (['.md', '.txt', '.json', '.html'].includes(ext)) {
                inputFiles.push({
                  name: file,
                  path: path.relative(process.cwd(), filePath),
                  directory: dir,
                  size: Math.round(stat.size / 1024), // Size in KB
                });
              }
            }
          }
        }
      } catch (error) {
        // Silently skip directories that can't be read
        continue;
      }
    }

    return inputFiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  async showMainMenu() {
    console.log('\n📝 Content Buddy - AI-Powered Content Generation');
    console.log('==================================================');
    console.log('1. Health Check');
    console.log('2. Generate Content');
    console.log('3. Scaffold Content');
    console.log('4. Run Evaluations');
    console.log('5. Validate Templates');
    console.log('6. Help & Information');
    console.log('7. Exit');
    console.log('==================================================');

    const choice = await this.prompt('Select an option (1-7): ');
    return choice.trim();
  }

  async handleHealthCheck() {
    console.log('\n🔍 Running Health Check...\n');
    await this.app.runHealthCheck();
    await this.prompt('\nPress Enter to continue...');
  }

  async handleGenerate() {
    console.log('\n🚀 Generate Content');
    console.log('Available templates:');
    console.log('- draft_scaffold@1.0.0');
    console.log('- repurpose_pack@1.0.0');
    console.log('- rewrite_localize@1.0.0');
    console.log('- section_expand@1.0.0');
    console.log('- summarize_grounded@1.0.0');

    const templateName = await this.prompt('\nEnter template name: ');
    if (!templateName.trim()) {
      console.log('❌ Template name is required');
      return;
    }

    // Show available input files
    console.log('\n📁 Available input files:');
    const inputFiles = this.scanInputFiles();

    if (inputFiles.length === 0) {
      console.log('No input files found in content directories.');
      console.log('You can still enter a custom file path below.');
    } else {
      console.log('─'.repeat(70));
      console.log(
        '# | File Name                    | Directory           | Size'
      );
      console.log('─'.repeat(70));

      inputFiles.forEach((file, index) => {
        const num = (index + 1).toString().padStart(2);
        const name = file.name.padEnd(28);
        const dir = file.directory.padEnd(19);
        const size = `${file.size}KB`.padStart(6);
        console.log(`${num}| ${name} | ${dir} | ${size}`);
      });
      console.log('─'.repeat(70));
    }

    let inputFilePath;

    if (inputFiles.length > 0) {
      const choice = await this.prompt(
        '\nEnter file number (1-' + inputFiles.length + ') or custom path: '
      );
      const choiceNum = parseInt(choice.trim());

      if (choiceNum >= 1 && choiceNum <= inputFiles.length) {
        inputFilePath = inputFiles[choiceNum - 1].path;
        console.log(`Selected: ${inputFilePath}`);
      } else if (choice.trim()) {
        inputFilePath = choice.trim();
      } else {
        console.log('❌ Input file selection is required');
        return;
      }
    } else {
      inputFilePath = await this.prompt('Enter input file path: ');
      if (!inputFilePath.trim()) {
        console.log('❌ Input file path is required');
        return;
      }
      inputFilePath = inputFilePath.trim();
    }

    const outputFile = await this.prompt('Enter output file path (optional): ');

    try {
      console.log('\n⏳ Generating content...');
      await this.app.runGenerate([
        templateName.trim(),
        inputFilePath,
        outputFile.trim(),
      ]);

      if (outputFile.trim()) {
        console.log(`✅ Content generated and saved to: ${outputFile.trim()}`);
      }
    } catch (error) {
      console.log(`❌ Generation failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleScaffold() {
    console.log('\n🏗️  Scaffold Content');

    const assetType = await this.prompt(
      'Enter asset type (e.g., "blog post", "article"): '
    );
    if (!assetType.trim()) {
      console.log('❌ Asset type is required');
      return;
    }

    const topic = await this.prompt('Enter topic: ');
    if (!topic.trim()) {
      console.log('❌ Topic is required');
      return;
    }

    const audience = await this.prompt('Enter target audience: ');
    if (!audience.trim()) {
      console.log('❌ Audience is required');
      return;
    }

    const tone = await this.prompt(
      'Enter tone (e.g., "professional", "casual"): '
    );
    if (!tone.trim()) {
      console.log('❌ Tone is required');
      return;
    }

    const wordCount =
      (await this.prompt('Enter word count (default: 600): ')) || '600';
    const outputFile = await this.prompt('Enter output file path (optional): ');

    try {
      console.log('\n⏳ Creating scaffold...');

      // Build the command arguments
      const args = [
        '--asset_type',
        assetType.trim(),
        '--topic',
        topic.trim(),
        '--audience',
        audience.trim(),
        '--tone',
        tone.trim(),
        '--word_count',
        wordCount.trim(),
      ];

      if (outputFile.trim()) {
        args.push('--output', outputFile.trim());
      }

      // Execute scaffold command using child_process
      const { spawn } = await import('child_process');
      const child = spawn('node', ['src/cli.js', 'scaffold', ...args], {
        stdio: 'inherit',
      });

      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            if (outputFile.trim()) {
              console.log(`✅ Scaffold saved to: ${outputFile.trim()}`);
            }
            resolve();
          } else {
            reject(new Error(`Scaffold command failed with code ${code}`));
          }
        });
        child.on('error', reject);
      });
    } catch (error) {
      console.log(`❌ Scaffold failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleEvaluate() {
    console.log('\n📊 Run Evaluations');
    const templateName = await this.prompt(
      'Enter template name (optional - leave blank for all): '
    );

    try {
      console.log('\n⏳ Running evaluations...');
      await this.app.runEvaluate(
        templateName.trim() ? [templateName.trim()] : []
      );
    } catch (error) {
      console.log(`❌ Evaluation failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleHelp() {
    console.log('\n📚 Help & Information');
    console.log('====================================');
    console.log('\n🏥 Health Check:');
    console.log(
      '   Runs system health checks including memory, disk, and system status.'
    );

    console.log('\n🚀 Generate Content:');
    console.log('   Uses AI templates to generate content from input files.');
    console.log('   Available templates:');
    console.log('   • draft_scaffold@1.0.0 - Create content scaffolds');
    console.log('   • repurpose_pack@1.0.0 - Repurpose existing content');
    console.log('   • rewrite_localize@1.0.0 - Rewrite and localize content');
    console.log('   • section_expand@1.0.0 - Expand content sections');
    console.log('   • summarize_grounded@1.0.0 - Create grounded summaries');

    console.log('\n🏗️  Scaffold Content:');
    console.log('   Interactively create structured content outlines.');
    console.log(
      '   Specify asset type, topic, audience, tone, and word count.'
    );

    console.log('\n📊 Run Evaluations:');
    console.log(
      '   Test and evaluate template performance and output quality.'
    );

    console.log('\n✅ Validate Templates:');
    console.log('   Check all templates for proper structure and validity.');

    console.log('\n💡 Tips:');
    console.log(
      '   • You can also run commands directly: node app.js <command>'
    );
    console.log('   • Set environment variables like LOG_LEVEL and PROVIDER');
    console.log('   • Check README.md for more detailed information');

    await this.prompt('\nPress Enter to continue...');
  }

  async handleValidate() {
    console.log('\n✅ Validate Templates');
    console.log('\n⏳ Validating all templates...');

    try {
      await this.app.runValidate();
    } catch (error) {
      console.log(`❌ Validation failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async run() {
    console.log('Welcome to Content Buddy Interactive Menu!');

    while (true) {
      try {
        const choice = await this.showMainMenu();

        switch (choice) {
          case '1':
            await this.handleHealthCheck();
            break;
          case '2':
            await this.handleGenerate();
            break;
          case '3':
            await this.handleScaffold();
            break;
          case '4':
            await this.handleEvaluate();
            break;
          case '5':
            await this.handleValidate();
            break;
          case '6':
            await this.handleHelp();
            break;
          case '7':
            console.log('\n👋 Goodbye!');
            this.rl.close();
            return;
          default:
            console.log('❌ Invalid choice. Please select 1-7.');
            await this.prompt('Press Enter to continue...');
        }
      } catch (error) {
        console.error('❌ An error occurred:', error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  close() {
    this.rl.close();
  }
}

class Application {
  constructor() {
    this.isShuttingDown = false;
    this.components = {};
  }

  async initialize() {
    try {
      // Initialize configuration
      this.components.config = new ConfigManager();
      await this.components.config.initialize();

      // Initialize observability
      this.components.observability = new Observability(
        this.components.config.get('observability', {})
      );

      // Initialize error handling
      this.components.errorHandling = new ErrorHandling(
        this.components.config.get('errorHandling', {})
      );

      // Initialize monitoring
      this.components.monitoring = new Monitoring(
        this.components.config.get('monitoring', {})
      );
      await this.components.monitoring.start();

      // Initialize provider manager
      this.components.providerManager = new ProviderManager(
        this.components.config.get('providers', {}),
        {
          observability: this.components.observability,
          errorHandling: this.components.errorHandling,
        }
      );

      // Initialize template manager
      this.components.templateManager = new TemplateManager(
        this.components.config.get('templates.directory', './prompts')
      );

      // Initialize main application
      this.components.contentBuddy = new ContentBuddy({
        providerManager: this.components.providerManager,
        templateManager: this.components.templateManager,
        config: this.components.config,
        observability: this.components.observability,
      });

      this.setupGracefulShutdown();
      this.components.observability.info(
        'Application initialized successfully'
      );
    } catch (error) {
      console.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      this.components.observability?.info(
        `Received ${signal}, shutting down gracefully`
      );

      try {
        // Stop monitoring
        if (this.components.monitoring) {
          await this.components.monitoring.stop();
        }

        // Close any open connections
        if (this.components.providerManager) {
          await this.components.providerManager.cleanup();
        }

        this.components.observability?.info(
          'Application shut down successfully'
        );
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      this.components.observability?.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.components.observability?.error(
        'Unhandled rejection at:',
        promise,
        'reason:',
        reason
      );
      shutdown('unhandledRejection');
    });
  }

  async run(command, args = []) {
    switch (command) {
      case 'health':
        return await this.runHealthCheck();

      case 'generate':
        return await this.runGenerate(args);

      case 'evaluate':
        return await this.runEvaluate(args);

      case 'validate':
        return await this.runValidate();

      case 'help':
        this.showHelp();
        return;

      default:
        console.log(`Unknown command: ${command}`);
        this.showHelp();
        return;
    }
  }

  async runHealthCheck() {
    try {
      const health = await this.components.monitoring.getHealthStatus();
      console.log(JSON.stringify(health, null, 2));

      if (health.status !== 'healthy') {
        process.exit(1);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  }

  async runGenerate(args) {
    try {
      const [templateName, inputFile, outputFile] = args;

      if (!templateName || !inputFile) {
        console.error('Usage: generate <template> <input-file> [output-file]');
        process.exit(1);
      }

      const result = await this.components.contentBuddy.generate({
        template: templateName,
        inputFile,
        outputFile,
      });

      console.log('Generation completed successfully:', result);
    } catch (error) {
      this.components.observability.error('Generation failed:', error);
      console.error('Generation failed:', error.message);
      process.exit(1);
    }
  }

  async runEvaluate(args) {
    try {
      const [templateName] = args;

      const results = await this.components.contentBuddy.evaluate({
        template: templateName,
      });

      console.log('Evaluation completed:', results);
    } catch (error) {
      this.components.observability.error('Evaluation failed:', error);
      console.error('Evaluation failed:', error.message);
      process.exit(1);
    }
  }

  async runValidate() {
    try {
      const validation =
        await this.components.templateManager.validateAllTemplates();
      console.log('Validation results:', validation);

      const hasErrors = validation.some(
        (result) => result.status === 'invalid'
      );
      if (hasErrors) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Content Buddy POC - AI-Powered Content Generation

Usage: node app.js [command] [args]

Interactive Mode:
  node app.js                Run interactive menu (default)

Commands:
  health                     Check system health and component status
  generate <template> <input> [output]  Generate content using specified template
  evaluate [template]        Run evaluation tests
  validate                   Validate all templates and configurations
  help                       Show this help message

Examples:
  node app.js                # Start interactive menu
  node app.js health
  node app.js generate repurpose_pack@1.0.0 input.json output.json
  node app.js evaluate
  node app.js validate

Environment Variables:
  NODE_ENV                   Application environment (development/production)
  LOG_LEVEL                  Logging level (debug/info/warn/error)
  PROVIDER                   Default AI provider (openai/anthropic/gemini)
  
For more information, see README.md
        `);
  }
}

// Main execution
async function main() {
  const app = new Application();
  await app.initialize();

  const command = process.argv[2];
  const args = process.argv.slice(3);

  // If no command provided, show interactive menu
  if (!command) {
    const menu = new InteractiveMenu(app);
    try {
      await menu.run();
    } finally {
      menu.close();
    }
    return;
  }

  // Otherwise run the specified command
  await app.run(command, args);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { Application };
