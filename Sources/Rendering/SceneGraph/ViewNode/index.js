import * as macro from '../../../macro';

export const PASS_TYPES = ['Build', 'Render'];

// ----------------------------------------------------------------------------
// vtkViewNode methods
// ----------------------------------------------------------------------------

function viewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewNode');

  // Builds myself.
  publicAPI.build = (prepass) => {
  };

  // Renders myself
  publicAPI.render = (prepass) => {
  };

  publicAPI.getViewNodeFor = (dataObject) => {
    if (model.renderable === dataObject) {
      return model;
    }

    model.children.find(child => {
      const vn = child.getViewNodeFor(dataObject);
      if (vn) {
        return vn;
      }
      return null;
    });
    return null;
  };

  publicAPI.getFirstAncestorOfType = (type) => {
    if (!model.parent) {
      return null;
    }
    if (model.parent.isA(type)) {
      return model.parent;
    }
    return model.parent.getFirstAncestorOfType(type);
  };

  publicAPI.traverse = (operation) => {
    publicAPI.apply(operation, true);

    model.children.forEach(child => {
      child.traverse(operation);
    });

    publicAPI.apply(operation, false);
  };

  publicAPI.traverseAllPasses = () => {
    publicAPI.traverse('Build');
    publicAPI.traverse('Render');
  };

  publicAPI.apply = (operation, prepass) => {
    switch (operation) {
      case 'Build':
        publicAPI.build(prepass);
        break;
      case 'Render':
        publicAPI.render(prepass);
        break;
      default:
        console.log(`UNKNOWN OPERATION  ${operation}`);
    }
  };

  publicAPI.addMissingNode = (dataObj) => {
    publicAPI.addMissingNodes([dataObj]);
  };

  publicAPI.addMissingNodes = (dataObjs) => {
    model.preparedNodes.add(dataObjs);

    model.children.concat(dataObjs.filter(node => {
      if (model.children.indexOf(node) === -1) {
        const newNode = publicAPI.createViewNode(node);
        if (newNode) {
          newNode.setParent(model);
        }
        return newNode;
      }
      return null;
    }));
  };

  publicAPI.prepareNodes = () => {
    model.preparedNodes = [];
  };

  publicAPI.removeUnusedNodes = () => {
    model.children.filter(node => {
      if (model.preparedNodes.indexOf(node.getRenderable()) !== -1) {
        return true;
      }
      return false;
    });
    publicAPI.prepareNodes();
  };

  publicAPI.createViewNode = (dataObj) => {
    if (!model.myFactory) {
      console.log('Can not create view nodes without my own factory');
      return null;
    }
    const ret = model.myFactory.createNode(dataObj);
    if (ret) {
      ret.renderable = dataObj;
    }
    return ret;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  parent: null,
  renderable: null,
  myFactory: null,
  children: [],
  preparedNodes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'parent',
    'renderable',
    'myFactory',
  ]);
  macro.getArray(publicAPI, model, ['children']);

  // Object methods
  viewNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, PASS_TYPES };
