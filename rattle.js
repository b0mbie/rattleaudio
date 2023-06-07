
window.onload = function () {

const rattle = window.rattle || {};
window.rattle = rattle;

try {
    /* Get the Web Audio API Audio Context constructor. */
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx)
        throw "Couldn't find the WebAudio API AudioContext constructor. " +
                "You might be running a version of Garry's Mod that doesn't " +
                "have support for WebAudio yet. Consider trying the Chromium " +
                "branch or ensure your game is updated.";
    
    /* Construct new Audio Context. */
    const Context = new AudioCtx();

    /* Get the Context's Listener. */
    const Listener = Context.listener;

    /**
     * Array of AudioNodes that were created. Index 0 is always the Context's
     * destination.
     */
    rattle.nodes = [ Context.destination ];

    /**
     * Get the AudioNode at this Node index.
     */
    rattle.getNode = function getNode(idx) {
        const node = rattle.nodes[idx];
        if (!node)
            throw `Invalid node index: ${idx}`;
        return node;
    };

    /**
     * Set a value immediately for a key in an AudioNode. If that field is an
     * AudioParam, setValueAtTime is used. Otherwise, the field is set directly.
     */
    function SetNodeValue(node, field, value) {
        if (node[field] instanceof AudioParam) {
            return node[field].setValueAtTime(value, Context.currentTime);
        }
        node[field] = value;
    };

    /**
     * Set a value immediately for a key in an AudioNode at the Node index.
     * If that field is an AudioParam, setValueAtTime is used. Otherwise, the
     * field is set directly.
     */
    rattle.setNodeValue = function setNodeValue(idx, field, value) {
        return SetNodeValue(rattle.getNode(idx), field, value);
    };

    /**
     * Create a new AudioNode of a specific class. Returns the Node's index.
     */
    rattle.create = function create(className, init) {
        /* Check if the constructor for this class exists in the Context. */
        const constructor = Context["create" + className];

        /* If it doesn't exist, the class is invalid. */
        if (!constructor)
            throw `Invalid rattle Node class: ${className}`;
        
        let node;

        if ((className + "Node") in window) {
            node = new window[className + "Node"](Context, init);
        } else {
            node = constructor();

            if (init) {
                for (const key in init) {
                    SetNodeValue(node, key, init[key]);
                }
            }
        }

        /* Try to find first free node index instead of pushing a new one. */
        let index;
        for (let i = 0; i < rattle.nodes.length; i++) {
            if (!rattle.nodes[i]) {
                index = i;
                break;
            }
        }

        if (!index) {
            index = rattle.nodes.length;
        }

        rattle.nodes[index] = node;
        return index;
    };

    /**
     * "Destroy" the AudioNode at the Node index, stopping it if necessary,
     * disconnecting it from everything, and removing it from the nodes array.
     */
    rattle.destroy = function destroy(idx) {
        const node = rattle.getNode(idx);
        if ("stop" in node) {
            node.stop();
        }
        node.disconnect();
        rattle.nodes[idx] = null;
    };

    /**
     * Call the function `func` and call `rattle.callback` with parameters
     * `(true, callback, returnValue)`. If an error occurred, then it is called
     * with `(false, callback, errorMessage)`.
     */
    rattle.icall = function icall(callback, func, ...params) {
        try {
            return rattle.callback(true, callback, func.apply(this, params));
        } catch (e) {
            return rattle.callback(false, callback, String(e));
        }
    };

    /**
     * Return the current AudioContext time.
     */
    rattle.time = function time() {
        return Context.currentTime;
    };

    /**
     * Set the pose of the Context Listener.
     */
    rattle.setPose = function setPose(x, y, z, fx, fy, fz, ux, uy, uz,
        smoothing = 0) {
        const time = Context.currentTime + smoothing;
    
        if (!Listener.positionX) {
            Listener.setPosition(x, y, z);
        } else {
            Listener.positionX.linearRampToValueAtTime(x, time);
            Listener.positionY.linearRampToValueAtTime(y, time);
            Listener.positionZ.linearRampToValueAtTime(z, time);
        }
    
        if (!Listener.forwardX) {
            Listener.setOrientation(fx, fy, fz, ux, uy, uz);
        } else {
            Listener.forwardX.linearRampToValueAtTime(fx, time);
            Listener.forwardY.linearRampToValueAtTime(fy, time);
            Listener.forwardZ.linearRampToValueAtTime(fz, time);
            Listener.upX.linearRampToValueAtTime(ux, time);
            Listener.upY.linearRampToValueAtTime(uy, time);
            Listener.upZ.linearRampToValueAtTime(uz, time);
        }
    };

    /**
     * Set the pose of a Panner.
     */
    rattle.setPannerPose = function setPannerPose(node, x, y, z,
        smoothing = 0) {
        const time = Context.currentTime + smoothing;
        node.positionX.linearRampToValueAtTime(x, time);
        node.positionY.linearRampToValueAtTime(y, time);
        node.positionZ.linearRampToValueAtTime(z, time);
    };
    
    /* Everything else can be done with queueing other JavaScript code. */

    /* Inform Lua that the library is ready. */
    return rattle.ready();
} catch (e) {
    return rattle.error(String(e));
}

};
