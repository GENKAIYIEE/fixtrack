const fs = require('fs');

try {
  const data = fs.readFileSync('lint-results.json', 'utf8');
  const jsonStart = data.indexOf('[');
  if (jsonStart === -1) {
    console.log("No JSON found");
    process.exit(1);
  }
  const json = JSON.parse(data.substring(jsonStart));
  const summary = json.filter(f => f.errorCount > 0 || f.warningCount > 0).map(f => {
    return {
      file: f.filePath.split('fixtrack\\\\')[1] || f.filePath,
      errors: f.errorCount,
      warnings: f.warningCount,
      messages: Array.from(new Set(f.messages.map(m => m.ruleId + ": " + m.message)))
    };
  });
  console.log(JSON.stringify(summary, null, 2));
} catch (e) {
  console.error("Error reading or parsing", e);
}
