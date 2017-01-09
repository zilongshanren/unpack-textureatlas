/****************************************************************************
Copyright (c) 2016-2017 zilongshanren

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/

'use strict';
const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');
const Del = require('del');

var sharpPath;
if (Editor.dev) {
  sharpPath = 'sharp';
} else {
  sharpPath = Editor.url('unpack://utils/sharp');
}
const Sharp = require(sharpPath);

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'unpack' () {
      Editor.Metrics.trackEvent({
        category: 'Packages',
        label: 'unpack-textureatlas',
        action: 'Open By Menu'
      }, null);

      let currentSelection = Editor.Selection.curSelection('asset');
      if (currentSelection.length > 0) {
        let selectionUUid = currentSelection[0];
        let selectionMeta = Editor.assetdb.loadMetaByUuid(selectionUUid);
        let assetInfo = Editor.assetdb.assetInfoByUuid(selectionUUid);
        var textureAtlasPath = Editor.assetdb.uuidToFspath(selectionMeta.rawTextureUuid);
        if (!textureAtlasPath) {
          Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['OK'],
            titile: 'Unpack Texture Packer Atlas',
            message: 'Please select a Texture Packer asset at first!',
            defaultId: 0,
            noLink: true
          });
          return;
        }
        var textureAtlasSubMetas = selectionMeta.getSubMetas();
      
        if (assetInfo.type === "sprite-atlas" 
            && selectionMeta.type === "Texture Packer"
            && textureAtlasSubMetas) {

          var extractImageSavePath = Path.join(Editor.projectPath, "temp", Path.basenameNoExt(textureAtlasPath));
          Fs.mkdirsSync(extractImageSavePath);

          var spriteFrameNames = Object.keys(textureAtlasSubMetas);
          Async.forEach(spriteFrameNames, function (spriteFrameName, next) {
            var spriteFrameObj = textureAtlasSubMetas[spriteFrameName];
            var isRotated = spriteFrameObj.rotated;
            var originalSize = cc.size(spriteFrameObj.rawWidth, spriteFrameObj.rawHeight);
            var rect = cc.rect(spriteFrameObj.trimX, spriteFrameObj.trimY, spriteFrameObj.width,spriteFrameObj.height);
            var offset = cc.p(spriteFrameObj.offsetX, spriteFrameObj.offsetY);
            var trimmedLeft = offset.x + (originalSize.width - rect.width) / 2;
            var trimmedRight = (originalSize.width - rect.width) / 2 - offset.x;
            var trimmedTop = (originalSize.height - rect.height) / 2 - offset.y;
            var trimmedBottom = offset.y + (originalSize.height - rect.height) / 2;

            if (isRotated) {
              Sharp(textureAtlasPath).extract({left: rect.x, top: rect.y, width: rect.height, height:rect.width})
                .background({r: 0, g: 0, b: 0, alpha: 0})
                .extend({top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight})
                .rotate(270)
                .toFile(Path.join(extractImageSavePath, spriteFrameName), (err) => {
                  if (err) {
                    Editor.error("Generating " + spriteFrameName + " error occurs, details:" + err);
                  }

                  Editor.log(spriteFrameName + " is generated successfully!");
                  next();
                });

            } else {
              Sharp(textureAtlasPath).extract({left: rect.x, top: rect.y, width: rect.width, height:rect.height})
                .background({r: 0, g: 0, b: 0, alpha: 0})
                .extend({top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight})
                .rotate(0)
                .toFile(Path.join(extractImageSavePath, spriteFrameName), (err) => {
                  if (err) {
                    Editor.error("Generating " + spriteFrameName + " error occurs, details:" + err);
                  }

                  Editor.log(spriteFrameName + " is generated successfully!");
                  next();
                });
            }
          }, () => {
            Editor.log(`There are ${spriteFrameNames.length} textures are generated!`);
            //start importing all the generated spriteframes
            Editor.Ipc.sendToMain( 'asset-db:import-assets', [extractImageSavePath],  'db://assets/', true, (err) => {
              if (err) Editor.log('Importing assets error occurs: details' + err);

              Del(extractImageSavePath, { force: true });
            }, -1);

          }); // end of Async.forEach

        } else {
          Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['OK'],
            titile: 'Unpack Texture Packer Atlas',
            message: 'The selected asset is not a Texture Packer asset!',
            defaultId: 0,
            noLink: true
          });
        }
      } else {
         Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['OK'],
            titile: 'Unpack Texture Packer Atlas',
            message: 'Please select a Texture Packer asset at first!',
            defaultId: 0,
            noLink: true
          });
      }
      
     
    },
  },
};
