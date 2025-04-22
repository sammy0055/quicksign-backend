require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");
// Create a single supabase client for interacting with your database
const SUPERBASE_URL = process.env.SUPERBASE_URL;
const SUPERBASE_STORAGE_KEY = process.env.SUPERBASE_STORAGE_KEY;
const bucketName = process.env.SUPERBASE_STORAGE_BUCKET_NAME;
const TEMPLATE_FOLDER = "pdf_template";
const EDITEDPDF_FOLDER = "pdf_files_to_sign";
const supabase = createClient(`${SUPERBASE_URL}`, `${SUPERBASE_STORAGE_KEY}`);

const addTemplateFile = async ({ file }) => {
  //dis is the template folder on superbase
  const { data, error } = await supabase.storage
    .from(`${bucketName}`)
    .upload(`${TEMPLATE_FOLDER}/${uuidv4()}.pdf`, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  return data;
};

const addEditedPdfFile = async (file) => {
  const { data, error } = await supabase.storage
    .from(`${bucketName}`)
    .upload(`${EDITEDPDF_FOLDER}/${uuidv4()}.pdf`, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  return data;
};

const downloadPdfFileWithPath = async (path) => {
  const { data, error } = await supabase.storage
    .from(`${bucketName}`)
    .download(`${path}`);

  if (error) {
    throw error;
  }
  return data;
};

const deletePdfTemplates = async (pathArray) => {
  const { data, error } = await supabase.storage
    .from(`${bucketName}`)
    .remove(pathArray);

  if (error) {
    throw error;
  }
  return data;
};

const replaceEditedPdf = async (path, file) => {
  const { data, error } = await supabase.storage
    .from(`${bucketName}`)
    .update(`${path}`, file.buffer, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.mimetype,
    });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  addTemplateFile,
  addEditedPdfFile,
  downloadPdfFileWithPath,
  deletePdfTemplates,
  replaceEditedPdf,
};
