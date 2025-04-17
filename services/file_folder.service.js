const db = require("../models");

class FileAndFolderService {
  static async addPdfFile(data, companyId) {
    if (!companyId) throw new Error("companyId is required");
    data.companyId = companyId;
    const file = await db.File.create(data);
    const folder = await db.Folder.findByPk(data.folderId);
    await db.Folder.update(
      { children: [...folder.children, file.id] },
      { where: { id: folder.id } }
    );
    return file;
  }

  static async addPdfFolder(data, companyId) {
    if (!companyId) throw new Error("companyId is required");
    data.companyId = companyId;
    const folder = await db.Folder.create(data);
    return folder;
  }

  static async removeFolder(id) {
    if (!id) throw new Error("folder not specified");
    await db.Folder.destroy({ where: { id } });
  }

  static async removeFile(id) {
    try {
      if (!id) throw new Error("file not specified");
      const transaction = await db.sequelize.transaction();
      const file = await db.File.findByPk(id);
      const folder = await db.Folder.findByPk(file.folderId);
      const newChildren = folder.children.filter((item) => item.id !== id);
      await folder.update({ children: newChildren }, { transaction });
      await file.destroy({ where: { id } }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getFilesAndFolders(companyId) {
    const folders = await db.Folder.findAll({ where: { companyId } });
    const populatedFolders = await Promise.all(
      folders.map(async (folder) => {
        const files = await db.File.findAll({ where: { id: folder.children } });
        return {
          ...folder.toJSON(),
          children: files,
        };
      })
    );
    return populatedFolders;
  }
}

module.exports = FileAndFolderService;
