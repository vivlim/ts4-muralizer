import { downloadZip, InputWithSizeMeta } from "client-zip";


export interface FileToZip {
  name: string,
  blob: Blob,
}

export async function downloadZipWithFiles(zipFilename: string, files: FileToZip[]){
    const filesWithMetadata: InputWithSizeMeta[] = files.map(f => {return {
        name: f.name,
        lastModified: new Date(),
        input: f.blob
    }});
    const zipBlob = await downloadZip(filesWithMetadata).blob();

    // make and click a temporary link to download the Blob
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFilename;
    link.click();
    link.remove();
}