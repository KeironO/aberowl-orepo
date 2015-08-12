$(function() {
  var visitialised = false;
  var ontology = $('#ontology_value').text();
  var versions = []
  var properties = [];
  var MAXLEVEL = 2; //Constant that represents the number of levels to show
  var MAXCHILDSTOSHOW = 15; //Constant that represents the numbers of nodes to show.
  
  var margin = {top: 20, right: 450, bottom: 20, left: 450},
  width = 960 - margin.right - margin.left,
  height = 600 - margin.top - margin.bottom;
  
  var i = 0,duration = 750, root;

  var tree = d3.layout.tree()
		.size([height, width]);
  var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

  var svg = d3.select("#infovis").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  $( "#tabs" ).tabs();
  $( "#tabs" ).on( "tabsactivate", function( event, ui ) {
    if(ui.newPanel.selector == '#pubmed') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#pubmed_autocomplete_tagsinput .tag span'),function(e,i){ $('#pubmed_autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#pubmed_autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
      $("#pubmed_button").click();
    } else if(ui.newPanel.selector == '#data') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#data_autocomplete_tagsinput .tag span'),function(e,i){ $('#data_autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#data_autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
      $("#data_button").click();
    } else if(ui.newPanel.selector == '#query') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        $.each($('#autocomplete_tagsinput .tag span'),function(e,i){ $('#autocomplete').removeTag($(i).text().trim())});
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#autocomplete').addTag(name);
        uriMap[name] = selectedNodes[0].data;
      }
    } else if(ui.newPanel.selector == '#sparql') {
      var tree = $.jstree.reference('#left_tree');
      var selectedNodes = tree.get_selected(true);
      if(selectedNodes.length > 0) {
        var name = selectedNodes[0].text;
        if(name.indexOf(' ') != -1) {
          name = '\'' + name + '\'';
        }
        $('#squery').val($('#squery').val().replace(/INSERT OWL HERE/, name));
      }
    } else if(ui.newPanel.selector == '#visualise' && !visitialised) {
		//Create a new ST instance  
		visitialised = true;		
		//Init the visualization
		initTree();
	 }//if
   });//tab
   
   /**
    * It updates the nodes in the visualization
    */
	function update(source) {
	  // Compute the new tree layout.
	  var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);

	  // Normalize for fixed-depth.
	  nodes.forEach(function(d) { d.y = d.depth * 180; });

	  // Update the nodes…
	  var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

	  // Enter any new nodes at the parent's previous position.
	  var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		  .on("click", click)
		  .on("mouseover", mouseover)
		  .on("mouseout", mouseout);

	  nodeEnter.append("circle")
		  .attr("r", 1e-6)
		  //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
		  .style("fill", function(d) { return d._children ? d.colour : d.leaf; })

	  nodeEnter.append("text")
		  .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		  .text(function(d) { return d.name; })
		  .style("fill-opacity", 1e-6);

	  // Transition nodes to their new position.
	  var nodeUpdate = node.transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

	  nodeUpdate.select("circle")
		  .attr("r", 4.5)
		  //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
		  .style("stroke", function(d) { return "black"; })
		  .style("fill", function(d) { return d._children ? d.colour : d.leaf; })

	  nodeUpdate.select("text")
		  .style("fill-opacity", 1);

	  // Transition exiting nodes to the parent's new position.
	  var nodeExit = node.exit().transition()
		  .duration(duration)
		  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		  .remove();

	  nodeExit.select("circle")
		  .attr("r", 1e-6);

	  nodeExit.select("text")
		  .style("fill-opacity", 1e-6);

	  // Update the links…
	  var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });

	  // Enter any new links at the parent's previous position.
	  link.enter().insert("path", "g")
		  .attr("class", "link")
		  .attr("d", function(d) {
			var o = {x: source.x0, y: source.y0};
			return diagonal({source: o, target: o});
		  });

	  // Transition links to their new position.
	  link.transition()
		  .duration(duration)
		  .attr("d", diagonal);

	  // Transition exiting nodes to the parent's new position.
	  link.exit().transition()
		  .duration(duration)
		  .attr("d", function(d) {
			var o = {x: source.x, y: source.y};
			return diagonal({source: o, target: o});
		  })
		  .remove();

	  // Stash the old positions for transition.
	  nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	  });
	}
	
	/**
	 * This function prints out recursevely the JSON structure.
	 */
	 function printJSON(node,level){
		if(typeof(node) === undefined){
			return;
		}
		var label = node.name;
		for(var i=0;i<level;i++){ label="\t"+label}
		console.log(label);
		if(node.children!=null){
		  $.each(node.children,function(index,child){
			  printJSON(child,level+1);
		  });
		}else{
		  $.each(node._children,function(index,child){
			printJSON(child,level+1);
		  });
		}
	 }
	 
	function buildFakeNode(name,min,max){
		var node = null;
		if(name!=null){
			node = {};
			node["name"] = name;
			node["data"] = {};
			node.data["min"] = min;
			node.data["max"] = max;
		}
		return(node);
	}
	
	function mouseover(d) {
		if(((d["versions"]!=undefined)&&(d["versions"]!=null))||((d["properties"]!==undefined)&&(d["properties"]!==null))){
			var toolTipText = "";
			if(d["versions"].length>1){
				toolTipText = "Versions: "+d["versions"].toString();
			}
			if(d["properties"].length>0){
				toolTipText = toolTipText+"  Properties: "+d["properties"].toString();
			}

			if(toolTipText.replace(/\s/g,'').length>0){
				d3.select(this).append("text")
				.attr("class", "hover")
				.attr('transform', function(d){ 
					return 'translate(5, -10)';
				})
				.text(toolTipText);
			}
		}
	}

	// Toggle children on click.
	function mouseout(d) {
		d3.select(this).select("text.hover").remove();
	}
	 

	/**
	 * Toggle children on click.
	 */
	function click(d) {
	  checkLevel(d);
	  if (d.children) {
		//collapse
		d._children = d.children;
		d.children = null;
	  } else {
		//expand
		if((d._children!=null)&&(d._children.length>MAXCHILDSTOSHOW)){
			d.children = d._children.splice(0,MAXCHILDSTOSHOW);
			d.children.push(buildFakeNode("˅˅˅",MAXCHILDSTOSHOW,MAXCHILDSTOSHOW+MAXCHILDSTOSHOW));
		}else if((d.name==="˄˄˄")||(d.name==="˅˅˅")){
			if((d.parent!=null)&&(d.parent!==undefined)){
				var parent = d.parent;					
				if(parent.children[0].name=="˄˄˄"){			
					parent.children = parent.children.splice(1,MAXCHILDSTOSHOW+1);//we delete the fake node				
				}else{
					parent.children = parent.children.splice(0,MAXCHILDSTOSHOW);				
				}
				var index = d["data"].min-MAXCHILDSTOSHOW // We calculate the last index to insert the children
				
				if(index>0){//We rebuild the parent._children vector
					parent._children = $,merge($.merge(parent._children.splice(0,index),parent.children),parent._children.splice(index,parent._children.length));
				}else{//0 position just have to merge
					parent._children = $.merge(parent.children,parent._children);
				}
				
				if(d.name==="˄˄˄"){//min					
					parent.children = []; //clean the visualizated children array
					if(d["data"].min-MAXCHILDSTOSHOW>0){
						parent.children = parent._children.splice(d["data"].min,MAXCHILDSTOSHOW);
						parent.children.unshift(buildFakeNode("˄˄˄",d["data"].min-MAXCHILDSTOSHOW-1,d["data"].min)-1);//We insert at the begining of the list
					}else{
						parent.children = parent._children.splice(0,MAXCHILDSTOSHOW);
					}	
					parent.children.push(buildFakeNode("˅˅˅",d["data"].max,d["data"].max+MAXCHILDSTOSHOW));					
					
					update(parent);
					return;
				}else if(d.name==="˅˅˅"){//max
					parent.children = []; //clean the visualizated children array
					if(d["data"].max+MAXCHILDSTOSHOW<parent._children.length){
						parent.children = parent._children.splice(d["data"].min,MAXCHILDSTOSHOW);
						parent.children.push(buildFakeNode("˅˅˅",d["data"].max+1,d["data"].max+MAXCHILDSTOSHOW+1));//We insert at the begining of the list
					}else{
						parent.children = parent._children.splice(d["data"].min,parent._children.length-d["data"].min);
					}	
					parent.children.unshift(buildFakeNode("˄˄˄",d["data"].min-MAXCHILDSTOSHOW,d["data"].min));
					
					update(parent);	
					return;			
				}
			}		
		}else{
			d.children = d._children;
			d._children = null;
		}
	  }
	  update(d);
	};
	
	/**
	 * This function checks the node level.
	 */ 
	function checkLevel(node){
	  if((node!=null)&&(typeof(node)!="undefined")){
		if((node.data["level"]!="undefined")&&(node.data["level"]<=MAXLEVEL)){
		  var newRoot = getRoot(node.data["owlClass"],node.name);
		  node.data["level"] = MAXLEVEL;
		  updateTree(node,MAXLEVEL-1); 
		}
	  }
	};

	/**
	 * This function update the tree
	 */
	 function updateTree(node,level){
		var def = $.Deferred();
		if(level==0){
			getRecursiveClasses(node,0,false).then(function(jsonTree){  
				update(node);
				def.resolve(node);	
			});	
			return(def.promise());	
		}
		if(node._children!=null){
		  node._children.forEach(function(child){
			child.data["level"] = MAXLEVEL;
			updateTree(child,level-1);
		  });
		}
		if(node.children!=null){
		  node.children.forEach(function(child){
			child.data["level"] = MAXLEVEL;
			updateTree(child,level-1);
		  });
		}		
		return(def.promise());
	 }

	
   /**
	 * This function gets the root of a tree. 
	 */
	function getRoot(){
		var root = null
		var data ={};		
		data["label"] = "owl:Thing";
		data["owlClass"] = "<http://www.w3.org/2002/07/owl#Thing>";
		data["classURI"] = "http://www.w3.org/2002/07/owl#Thing";
		var root = buildNode(data,0,0);
		if((versions!==undefined)&&(versions.length>0)){
			for(var i=1;i<versions.length;i++){//We add others versions
				if(versions[i]!=null){
					root["versions"].push(versions[i]);
				}
			}
		}	
		return(root);
	};   
   
   /**
    * It provides the colour of each node.
    */
   function getColour(index){
	   	var numElements = $('.checkbox').length+1;//number of checkboxes and the actual version
		var grades = 360;
		var angle = Math.round(360/numElements)*index;
		return('hsl('+angle+',100%,50%)');
	};
	
	/**
	 * This function builds a node using provided data.
	 */
	function buildNode(data, level,index){
		var node = null
		if(data!=null){
			node = {};
			node["name"] = data.label;
			node["data"] = {};
			node.data["owlClass"] = data.owlClass;
			node.data["level"] = MAXLEVEL - level;
			//collapse the nodes children = null and  _children = []
			node["children"] = null;
			node["_children"] = null;
			node["versions"] = []; //Array of versions that this node belongs
			node["properties"] = []; //Array of properties that this node has
			updateNodeInfo(node,index);
		}
		return(node);
	};
	
	/**
	 * This function get attribute (property/version) from index given. 
	 */
	function getAttribute(index){
		var attribute = null;
		var counter =0;		
		for(var i=0;i<versions.length;i++){
			if(versions[i]!=null){
				if(counter==index){
					attribute = {};
					attribute["index"] = i;
					attribute["attribute"] = versions[i];
					return(attribute);
				}
				counter++;								
			}
		}
		for(var j=0;j<properties.length;j++){
			if(properties[j]!=null){
				if(counter==index){
					attribute = {};
					attribute["index"] = j;
					attribute["attribute"] = properties[j];
					return(attribute);
				}
				counter++
			}
		}
		return(attribute);
	}
	
	/**
	 * This function updates the information (property/version) from given node.
	 */
	function updateNodeInfo(node,index){
		if((index!=null)&&(index>=0)){
			var attribute = getAttribute(index);
			if(attribute!=null){
				if(isNaN(attribute["attribute"])){//it is a property
					node["properties"].push(attribute["attribute"]);
				}else{//it is a property					
					node["versions"].push(attribute["attribute"]);
				}
				if(node["colour"]===undefined){
					node["colour"] = getColour(attribute["index"]);
					regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
					result = regexp.exec(node["colour"]).slice(1);
					result[2] = parseFloat(result[2])+30;
					node["leaf"] ="hsl("+result[0]+","+result[1]+","+result[2]+"%)";  
				}
			}
		}
		return(node);
	}
	
	/**
	 *  This function collapses the subnodes of given
	 */
	var collapse =   function collapse(d) {
		if (d.children) {
		  d._children = d.children;
		  d._children.forEach(collapse);
		  d.children = null;
		}
	}
	
	
	function initTree(){
		getRecursiveClasses(getRoot(),0,false).done(function(data){
			if(data!=null){
				root = data;
				root.x0 = height / 2;
				root.y0 = 0;
				update(root);
				click(root);
				d3.select(self.frameElement).style("height", "800px");
			}
		});
	}
	
	function isChildIncluded(node,child,index){
		if((node!=null)&&(child!=null)){
			if(node.children!=null){
				var subChild;
				for(var i=0;i<node._children.length;i++){
					subChild = node._children[i];
					if(subChild["data"].owlClass == child.owlClass){
						updateNodeInfo(subChild,index);
						return(true);
					}
				}
			}
			if(node._children!=null){
				var subChild;
				for(var i=0;i<node._children.length;i++){
					subChild = node._children[i];
					if(subChild["data"].owlClass == child.owlClass){				
						updateNodeInfo(subChild,index);
						return(true);
					}				
				}
			}
		}
		return(false)
	}
	
   /**
    * It gets the subclases from a uriClass given.
    */
   function getSubClasses(owlClass,version,type,objectProperty){
	   if((type=='subeq')&&(objectProperty!=null)){
			//console.log('/service/api/runQuery.groovy?type='+type+'&query='+objectProperty+' SOME '+owlClass+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+objectProperty+' SOME '+owlClass+'&ontology='+ontology+'&version='+version));
	   }else{
			//console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version));
		}
   };
	
	/**
	 * This function implements a kind of Breadth-first search (BFS) to build the tree.
	 * 
	 * listNodes: contains the expanded nodes.
	 * index: refers the index.
	 * node: the tree that is being built.
	 */
	function getRecursiveClasses(node,level,expand){
		var def = $.Deferred();
		if(level>=MAXLEVEL){			
			def.resolve(node);
			return(def.promise());
		}
		if(node!=null){
			var promises = [];
			var child;
			if((node["versions"]!=null)&&(node["versions"].length>0)){
				var version;
				var property;
				for(var i = 0; i<node["versions"].length;i++){//versions
					version = node["versions"][i];
					if(version!=null){
						var promise = getSubClasses(node.data["owlClass"],version,"subclass",null);
						promises.push(promise);
					}
				}
				for(var i = 0; i<node["versions"].length;i++){//versions
					version = node["versions"][i];
					if(version!=null){
						for(var j = 0; j<properties.length;j++){//properties
							property = properties[j];
							if(property!=null){
								var promise = getSubClasses(node.data["owlClass"],version,"subeq",property);
								promises.push(promise);
							}
						}
					}
				}
				$.when.apply($,promises).then(function(){
					if((arguments!=null)&&(arguments.length>0)){
						
						$.each(arguments, function(index,queryResult){
							//To fix some problems when the properties or versions are selected.
							if(queryResult.result==undefined){
								queryResult = queryResult[0];
							}						
							if((queryResult!=null)&&(queryResult.result!=null)){
								$.each(queryResult.result, function(childIndex,child){	
									if((child!=null)&&(typeof(child)!==undefined)&&(!child.deprecated)){									
										if(!isChildIncluded(node,child,index)){
											if(expand){								
												if(node.children == null){
												  node.children=[];
												}
												var newChild = buildNode(child,level,index);
												node.children.push(buildNode(child,level,index));
												node._children = null;
											}else{
												if(node._children == null){
												  node._children=[];
												}
												node._children.push(buildNode(child,level,index));
												node.children = null;
											}
										}								
									}
								});	
							}												
						});
						//Once we have collected the children, after that we have to expand the next level
						if(node.children!=null){
							$.each(node.children,function(index,child){						
								if(child!=null){
									var promise	= getRecursiveClasses(child,level+1,expand);
									promises.push(promise);
								}
								});
							$.when.apply($,promises).done(function(){
								if((arguments!=null)&&(arguments.length>0)){
									def.resolve(node);	
								}
							});
						}else{
							def.resolve(node);
						}
					}
				});	
			}
		}
		return(def.promise());
	};
	//Get the object properties from the server.
	$.getJSON('/service/api/getObjectProperties.groovy?ontology='+ontology,function(jsonData,textStatus,jqXHR) {				
		if(jsonData!=null){
			$.each(jsonData,function(key,value){	
				$('#properties').append($("<option></option>")
			.attr("value",value)
			.text(key)); 			
			});
		}		
		versions = JSON.parse($('#num_versions').text())
				
		//Reset the selected options.
		$("select option").prop("selected", false)
		
		
		$('.multiselect').each(function(component){			
			$(this).multiselect();  
		});
		$('.checkbox').each(function(index){
			$(this).css('color',getColour(index+1));
		});
		$('#versions').change(function(){
			$('#versions option').each(function(index){
				if($(this).is(':checked')){
					//index = 0 is the actual version
					versions[index+1] = $(this).attr('value');
				}else{
					versions[index+1] = null;
				}
			});
			console.log(versions.toSource());
			initTree();
		});
		$('#properties').change(function(){
			$('#properties option').each(function(index){
				if($(this).is(':checked')){
					properties[index] = $(this).attr('value');
				}else{
					properties[index] = null;
				}
			});
			console.log(properties.toSource());
			initTree();
		});	
  });
});
