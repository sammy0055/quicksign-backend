const fs = require("fs");
const csvParser = require("csv-parser");

/**
 * Utility function to parse a CSV file and return an array of client objects.
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<{validClients: Array, invalidClients: Array}>} A promise that resolves with an object containing valid and invalid clients.
 */
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const validClients = [];
    const invalidClients = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Check for required fields
        if (!row.name || !row.email || !row.phone) {
          invalidClients.push({ ...row, reason: "Missing required fields" });
          return;
        }

        // Add the valid client to the list
        validClients.push({
          name: row.name,
          companyNumber: row.companyNumber,
          email: row.email,
          phone: row.phone,
          companyName: row.companyName,
          city: row.city,
          street: row.street,
          streetNumber: row.streetNumber,
          entranceNumber: row.entranceNumber,
          fullAddress: row.fullAddress,
          companyStamp: row.companyStamp,
          userId: row.userId,
        });
      })
      .on("end", () => resolve({ validClients, invalidClients }))
      .on("error", (error) => reject(error));
  });
}

module.exports = {
  parseCsv,
};
