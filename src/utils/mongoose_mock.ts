import * as fs from "fs";
import * as path from "path";

const DB_FILE = path.join(process.cwd(), "learningPlatform_db.json");

// Helper to load/save JSON database
function loadData(): Record<string, any[]> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {};
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content || "{}");
  } catch (err) {
    console.error("Mongoose Mock read error:", err);
    return {};
  }
}

function saveData(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Mongoose Mock write error:", err);
  }
}

export const mongoose = {
  connect: async (url: string) => {
    console.log(`[Mongoose Mock] Simulating connection to ${url}`);
    if (!fs.existsSync(DB_FILE)) {
      saveData({});
    }
    return { connection: { host: "localhost" } };
  },

  Schema: class Schema {
    definition: any;
    options: any;
    constructor(definition: any, options?: any) {
      this.definition = definition;
      this.options = options;
    }
  },

  model: function model(modelName: string, schema: any) {
    return class ModelInstance {
      _id: string;
      [key: string]: any;

      constructor(data: any) {
        Object.assign(this, data);
        this._id = data._id || modelName.toLowerCase() + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        
        // Handle defaults
        if (schema && schema.definition) {
          for (const key of Object.keys(schema.definition)) {
            if (this[key] === undefined) {
              const def = schema.definition[key];
              if (def && typeof def === "object" && def.default !== undefined) {
                if (typeof def.default === "function") {
                  this[key] = def.default();
                } else {
                  this[key] = def.default;
                }
              }
            }
          }
        }
      }

      async save(): Promise<ModelInstance> {
        const allData = loadData();
        if (!allData[modelName]) {
          allData[modelName] = [];
        }
        
        const idx = allData[modelName].findIndex((item: any) => item._id === this._id);
        const savedDoc = { ...this };
        if (idx >= 0) {
          allData[modelName][idx] = savedDoc;
        } else {
          allData[modelName].push(savedDoc);
        }
        
        saveData(allData);
        return this;
      }

      static async find(query: any = {}): Promise<any[]> {
        const allData = loadData();
        const docs = allData[modelName] || [];
        return docs.filter((doc: any) => {
          for (const key of Object.keys(query)) {
            if (doc[key] !== query[key]) return false;
          }
          return true;
        }).map((d: any) => new ModelInstance(d));
      }

      static async findOne(query: any = {}): Promise<any | null> {
        const allData = loadData();
        const docs = allData[modelName] || [];
        const found = docs.find((doc: any) => {
          for (const key of Object.keys(query)) {
            if (doc[key] !== query[key]) return false;
          }
          return true;
        });
        return found ? new ModelInstance(found) : null;
      }

      static async findById(id: string): Promise<any | null> {
        return this.findOne({ _id: id });
      }

      static async deleteMany(query: any = {}): Promise<{ deletedCount: number }> {
        const allData = loadData();
        const docs = allData[modelName] || [];
        let deletedCount = 0;
        const remaining = docs.filter((doc: any) => {
          const match = Object.keys(query).every(key => doc[key] === query[key]);
          if (match) deletedCount++;
          return !match;
        });
        allData[modelName] = remaining;
        saveData(allData);
        return { deletedCount };
      }
    };
  }
};
