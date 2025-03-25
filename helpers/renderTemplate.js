const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

/**
 * Reads a template file, compiles it with the given data,
 * and returns the rendered HTML.
 * @param {string} templateName - Filename of the template (e.g., 'task-email.html')
 * @param {object} data - Data to inject into the template
 * @returns {Promise<string>} Rendered HTML
 */
const renderTemplate = (templateName, data) => {
  return new Promise((resolve, reject) => {
    const templatePath = path.join(
      __dirname,
      "..",
      "mailTemplates",
      templateName
    );
    fs.readFile(templatePath, "utf8", (err, source) => {
      if (err) {
        return reject(err);
      }
      try {
        const template = handlebars.compile(source);
        const html = template(data);
        resolve(html);
      } catch (compileErr) {
        reject(compileErr);
      }
    });
  });
};

module.exports = renderTemplate;
