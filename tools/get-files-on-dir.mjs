import {lstatSync, readdirSync} from "node:fs";
import {join} from "node:path";

export function getFilesOnDir(path = "", _files = []) {
  readdirSync(path)
    .forEach(file => {
      const filePath = join(path, file);
      const stat= lstatSync(filePath);
      if (stat.isFile())
        _files.push(filePath.toString());
      else getFilesOnDir(filePath, _files);
    });

  return _files;
}