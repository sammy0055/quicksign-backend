require("dotenv").config();
import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const SUPERBASE_URL = process.env.SUPERBASE_URL;
const SUPERBASE_STORAGE_KEY = process.env.SUPERBASE_STORAGE_KEY;
const supabase = createClient(`${SUPERBASE_URL}`, `${SUPERBASE_STORAGE_KEY}`);

const addFile = (data) => {};

module.exports = { addFile };
