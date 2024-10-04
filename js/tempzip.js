
class TempZip {
	constructor(zip) {
		this.zip = zip.clone();
		if (!zip) {
			throw new Error("Zip object is required");
		}
		this.tempDir = null;
		this.files = {};
	}

	async createTempDir() {
		this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tempzip-"));
		return this.tempDir;
	}

	async cleanup() {
		if (this.tempDir) {
			await fs.rm(this.tempDir, { recursive: true, force: true });
			this.tempDir = null;
		}
	}

	async withTempDir(callback) {
		try {
			this.tempDir = await this.createTempDir();
			// extract all zip files
			for (const [name, file] of Object.entries(this.zip.files)) {
				if (file.dir) {
					continue;
				}
				await this.zip
					.file(name)
					.async("uint8array")
					.then(async (data) => {
						const filePath = path.join(this.tempDir, name);
						await fs.writeFile(filePath, data);
						this.files[name] = filePath;
					});
			}
			return await callback(this);
		} finally {
			await this.cleanup();
		}
	}
}

module.exports = {
	TempZip
};