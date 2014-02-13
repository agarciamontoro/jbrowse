/**
 * Each JBrowse component has a Configuration.
 *
 * Each configuration has a number of Slots, each of which has a name
 * like "foo.bar.baz", a value, and some other properties that
 * describe it.
 *
 * Each Slot also has metadata that records the relative path of the
 * config file it was loaded from, if any.
 */

define( [
            'dojo/_base/declare',
            'dojo/_base/lang',
            'dojo/_base/array'
        ],
        function(
            declare,
            lang,
            array
        ) {

var Configuration = declare( null, {

    constructor: function( schema, base ) {
        this._base  = {};
        this._compilationCache = {};
        this._listeners = {};

        if( ! schema )
            throw new Error('must provide a schema to Configuration constructor');

        this._schema = schema;

        if( base )
            this.loadBase( base );

        // TODO: load the local configuration
        this._local = {};
    },

    set: function( key, val, runWatchCallbacks ) {
        var oldval;
        try { oldval = this.get( key ); } catch(e) {}
        val = this._local[ key ] = this._schema.normalizeSetting( key, val );
        delete this._compilationCache[ key ];
        if( runWatchCallbacks === undefined || runWatchCallbacks )
            this._notify( key, oldval, val );
        return val;
    },

    _notify: function( path, oldval, newval ) {
        var listeners = this._listeners[path];
        if( listeners )
            array.forEach( listeners.slice(), function( l ) {
                               if( l && l.callback )
                                   l.callback( path, oldval, newval );
                           });
    },

    watch: function( path, callback ) {
        var listeners = this._listeners[path]
            || ( this._listeners[path] = [] );

        var l = {
            callback: callback,
            remove: function() {
                array.forEach( listeners, function( other, i ) {
                                   if( other === l )
                                       listeners[i] = undefined;
                               });
                this.remove = function() {};
            }
        };

        listeners.push( l );
    },

    /**
     * Given a dot-separated string configuration path into the config
     * (e.g. "style.bg_color"), get the value of the configuration.
     *
     * If args are given, evaluate the configuration using them.
     * Otherwise, return a function that returns the value of the
     * configuration when called.
     */
    get: function( key, args ) {
        return this.getFunc( key ).apply( this, args );
    },

    getFunc: function( key ) {
        return this._compilationCache[ key ] || ( this._compilationCache[ key ] = this._compile( key ) );
    },

    _compile: function( key ) {
        var confVal = this.getRaw( key );

        return typeof confVal == 'function'
            ? confVal
            : function() { return confVal; };
    },

    getRaw: function( key ) {
        if( ! this._schema.getSlot( key ) ) {
            console.warn('Attempt to access undefined configuration key "'+key+'"');
            return undefined;
        }

        return key in this._local ? this._local[ key ] :
               key in this._base  ? this._base[key] :
                                    this._schema.getDefaultValue( key );
    },

    /**
     * Load the given base configuration, overwriting any existing
     * values.
     */
    loadBase: function( input ) {
        this._load( input, this._base, '' );
    },
    _load: function( input, targetConf, path ) {
        for( var k in input ) {
            var fullKey = path+k;
            var v = input[k];
            if( v === undefined )
                continue;

            var slot = this._schema.getSlot( fullKey );
            if( slot ) {
                targetConf[ fullKey ] = typeof v == 'function' ? slot.normalizeFunction( v, this )
                                                               : slot.normalizeValue( v, this );
            }
            else if( typeof v == 'object' && ! lang.isArray(v) ) {
                this._load( v, targetConf, fullKey+'.' );
            }
            else {
                //throw new Error( 'Unknown configuration key '+fullKey );
                console.warn( 'Unknown configuration key "'+fullKey+'", in base configuration, ignoring.' );
            }
        }
    },

    /**
     * Inspect this configuration to find any variables that are not
     * set, but that are marked as 'required'.
     */
    missingRequired: function() {
        var errors = [];
        array.forEach( this._schema.getAllSlots(), function( slot ) {
            var name = slot.name;
            if( slot.required && !( 'defaultValue' in slot ) && ! ( name in this._local || name in this._base ) )
                errors.push( slot.name );
        }, this );
        return errors;
    },

    /**
     * Load the given local configuration, overwriting any existing
     * values.
     */
    loadLocal: function( conf, keyBase ) {
        this._load( input, this._local, '' );
    },

    /**
     * Validate and possibly munge the given value before setting.
     * NOTE: Throw an Error object if it's invalid.
     */
    normalizeSetting: function( key, val ) {
        return this._schema.normalizeSetting( key, val, this );
    },

   /**
    * Get a nested object containing all the locally-set configuration
    * data for this configuration.
    */
    exportLocal: function() {
        return this._flatToNested( this._local );
    },

    /**
     * Get a nested object containing the base configuration data.
     */
    exportBase: function() {
        return this._flatToNested( this._base );
    },

    /**
     * Get a new base for this configuration, with the local settings merged in.
     */
    exportMerged: function() {
        return this._flatToNested( this._unwrapFunctions( lang.mixin( {}, this._base, this._local ) ) );
    },

    // undo the function wrapping that the Schema does for normalizing values
    _unwrapFunctions: function( inconf ) {
        var outconf = {};
        for( var k in inconf ) {
            if( typeof inconf[k] == 'function' && inconf[k].originalFunction )
                outconf[k] = inconf[k].originalFunction;
            else
                outconf[k] = inconf[k];
        }
        return outconf;
    },

    // convert a flat config object { 'foo.bar.baz' : 42, ... } to a
    // nested config object like { foo: { bar: { baz: 42 } } }
    _flatToNested: function( flatconf ) {

        function _set(conf,path,val) {
            if( path.length > 1 ) {
                var k = path.shift();
                var sub = conf[k];
                if( ! sub )
                    sub = conf[k] = {};
                _set( sub, path, val );
            } else {
                conf[ path[0] ] = val;
            }
        }

        var nested = {};
        for( var k in flatconf ) {
            var path = k.split('.');
            _set( nested, path, flatconf[k] );
        }

        return nested;
    }
});

return Configuration;
});


// == schema : nested object specifying what slots a configuration has, and
// their default values.  usually hardcoded.

// == base: nested object specifying a new set of default values for the
// spec.  values in there that do not match a spec are ignored

// == local: nested object specifying the value that have been set
// locally in this browser or by this user.  should be persisted in
// local storage and in cloud accounts if available.