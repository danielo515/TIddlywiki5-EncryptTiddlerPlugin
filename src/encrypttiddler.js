/*\
title: $:/plugins/danielo515/encryptTiddler/encrypttiddler.js
type: application/javascript
module-type: widget

encrypttiddler widget


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var encryptTiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
			{type: "tw-encrypt-tiddler", handler: "handleEncryptevent"},
			{type: "tw-decrypt-tiddler", handler: "handleDecryptevent"},
			]);
};

/*
Inherit from the base widget class
*/
encryptTiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
encryptTiddlerWidget.prototype.render = function(parent,nextSibling) {
	console.log("Render");
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
encryptTiddlerWidget.prototype.execute = function() {
	// Get attributes
	 this.tiddlerTitle=this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	 this.filter=this.getAttribute("filter",undefined);
 	 this.passwordTiddler1=this.getAttribute("passwordTiddler1");
 	 this.passwordTiddler2=this.getAttribute("passwordTiddler2");
	// Construct the child widgets
	console.log(this.targetTiddler);
		this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
encryptTiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.filter) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

encryptTiddlerWidget.prototype.getTiddlersToProcess = function(){
	if(this.filter){ //we have a filter to work with
		return this.wiki.filterTiddlers(this.filter);
	}else{ //single tiddler case
		var tiddler = this.wiki.getTiddler(this.tiddlerTitle);
		return tiddler? [tiddler.fields.title] : [];
	}
};

encryptTiddlerWidget.prototype.handleEncryptevent = function(event){
	var password = this.getPassword();
	var tiddlers = this.getTiddlersToProcess();

	if(tiddlers.length > 0 && password){
		var self = this;
		$tw.utils.each(tiddlers, function(title){
			var tiddler = self.wiki.getTiddler(title);
			var fields={text:"!This is an encrypted Tiddler",
								  encrypted:self.encryptFields(title,password)};
			self.saveTiddler(tiddler,fields);
		});

	}else{
		console.log("We did not find any tiddler to encrypt or password not set!")
	}
};

encryptTiddlerWidget.prototype.handleDecryptevent = function(event){
	var password =this.getPassword();
	var tiddlers = this.getTiddlersToProcess();

	if(tiddlers.length > 0 && password){
		var self = this;
		$tw.utils.each(tiddlers, function(title){
			var tiddler = self.wiki.getTiddler(title);
			var fields = self.decryptFields(tiddler,password);
			if(fields)self.saveTiddler(tiddler,fields);
		});
	}
};

encryptTiddlerWidget.prototype.saveTiddler=function(tiddler,fields){
	this.wiki.addTiddler(  new $tw.Tiddler(this.wiki.getModificationFields(),tiddler,this.clearNonStandardFields(tiddler), fields ) )
}

encryptTiddlerWidget.prototype.encryptFields = function (title,password){
	var jsonData=this.wiki.getTiddlerAsJson(title);
	return $tw.crypto.encrypt(jsonData,password);

};

encryptTiddlerWidget.prototype.decryptFields = function(tiddler,password){
		var JSONfields =$tw.crypto.decrypt(tiddler.fields.encrypted,password);
		if(JSONfields!==null){
			return JSON.parse(JSONfields);
		}
		console.log("Error decrypting "+tiddler.fields.title+". Probably bad password")
		return false
};

encryptTiddlerWidget.prototype.getPassword1 = function(){
	var tiddler=this.wiki.getTiddler(this.passwordTiddler1);
	if(tiddler){
		var password=tiddler.fields.text;
		this.saveTiddler(tiddler); //reset password tiddler
		return password;
	}

	return false
};

encryptTiddlerWidget.prototype.getPassword2 = function(){
	var tiddler=this.wiki.getTiddler(this.passwordTiddler2);
	if(tiddler){
		var password=tiddler.fields.text;
		this.saveTiddler(tiddler); //reset password tiddler
		return password;
	}

	return false
}

encryptTiddlerWidget.prototype.getPassword = function(){
    var password1 = this.getPassword1();
    var password2 = this.getPassword2();

    if (password1 == password2 || password2 == "") {
        return password1;
    }

    return null;
}

// This function erases every field of a tiddler that is not standard and also
// the text field
encryptTiddlerWidget.prototype.clearNonStandardFields =function(tiddler) {
	var standardFieldNames = "title tags modified modifier created creator".split(" ");
		var clearFields = {};
		for(var fieldName in tiddler.fields) {
			if(standardFieldNames.indexOf(fieldName) === -1) {
				clearFields[fieldName] = undefined;
			}
		}
		console.log("Cleared fields "+JSON.stringify(clearFields));
		return clearFields;
};

exports.encryptTiddler = encryptTiddlerWidget;

})();
