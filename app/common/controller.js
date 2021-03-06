const fs = require('fs');
const path = require('path');
class Controllers {
    async readdirSync(pathurl) {

        let params = fs.readdirSync(pathurl);
        let separate = await this.separate(pathurl, params);

        let controller = await this.ctrlPath(pathurl, separate['files']);

          let paths = await this.readfile(pathurl, separate['paths']);

        let pathCtrl = await this.pathCtrl(pathurl, paths);
        let controllers = this.mergeCtrl(controller, pathCtrl);//合并控制器

        return new Promise((resolve, reject) => {
            resolve(controller);
        });

    }
    //合并控制器
    mergeCtrl(ctrl1, ctrl2) {
        for (let i in ctrl1) {
            if (ctrl2[i]) {
                ctrl1[i]['children'] = ctrl2[i]['children'];
                delete ctrl2[i];
            }
        }
        for (let i in ctrl2) {
            ctrl1[i] = ctrl2[i];
        }
        return ctrl1;
    }

    //路径中的控制器
    async pathCtrl(pathurl, paths) {

        let controller = {};

        for (let i in paths) {
            let files = paths[i]['files'];
            let url = path.join(pathurl, i);
            controller[i.toLowerCase()] = {
                type: 'path',
                children: await this.ctrlPath(url, files)
            };
        }

        return new Promise((resolve, reject) => {
            resolve(controller);
        })

    }

    async ctrlPath(pathurl, ctrl) {
        let controller = {};
        for (let i in ctrl) {
            if (ctrl[i].indexOf('.js') >= 0) {
                let ctrlName = ctrl[i].split('.')[0].toLowerCase();
                controller[ctrlName] = {
                    type: 'Controller',
                    controller: require(path.join(pathurl, ctrl[i])),
                    path: path.join(pathurl, ctrl[i])
                }
            }

        }
        return controller;
    }
    //判断是不是文件夹
    async isPath(path) {

        let stat = fs.lstatSync(path);
        return stat.isDirectory();
    }
    async readfile(path, params) {
        let paths = {};
        for (let i in params) {
            paths[params[i].toLowerCase()] = {
                type: 'path',
                files: fs.readdirSync(path + params[i])
            }
        }
        return paths;
    }
    //分开路径与目录
    async separate(pathurl, params) {
        let paths = [];
        let files = [];
        for (let i in params) {
            if (await this.isPath(path.join(pathurl, params[i]))) {
                paths.push(params[i])
            } else {
                files.push(params[i]);
            }
        }
        return new Promise((resolve, reject) => {
            resolve({
                files: files,
                paths: paths
            });
        })

    }

    //获取控制器的方法名
    funName(controller) {
      for (let i in controller) {
        if (controller[i]['type'] == 'Controller') {
          let data = fs.readFileSync(controller[i]['path'], "utf-8");
          let arr = [];
          data.replace(/async[ ]+[\w|_]+/ig, function(val) {
            let vs = val.replace('async', '');
            vs = vs.replace(/\s+/g, "");
            if(vs !='init'){
                  arr.push(vs);
            }
            return val;
          })
          controller[i]['fun_name'] = arr;
          controller = this.childFunName(controller, i);
        } else {
          controller = this.childFunName(controller, i);
        }
      }
      return controller;
    }
    //获取子文件夹控制器方法
    childFunName(controller, i) {
      let child = controller[i]['children'];
      if (child) {
        for (let a in child) {
          let arr = [];
          if (child[a]['type'] == 'Controller') {
            let data = fs.readFileSync(child[a]['path'], "utf-8");
            data.replace(/async[ ]+[\w|_]+/ig, function(val) {
              let vs = val.replace('async', '');
              vs = vs.replace(/\s+/g, "");
              arr.push(vs);
              return val;
            })
          }
          controller[i]['children'][a]['fun_name'] = arr;
        }
      }
      return controller;
    }

}
module.exports = new Controllers();
