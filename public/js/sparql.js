function changeSPARQLQuery(to) {
  var query = $('#squery');
  var qtype = $('#qtype');
  var ontology = $('#ontology_value').text();

  if(to == 'values') {
    qtype.val("values");
    query.val("SELECT ?s ?p ?o WHERE { \n" +
      "  ##############################################\n" +
      "  # binds ?ontid to the results of the OWL query \n" +
      "  VALUES ?ontid { \n" +
      "    OWL subclass <http://aber-owl.net/aber-owl/service/> <"+ ontology +">\n" +
      "      { INSERT OWL HERE }\n" +
      "  } . \n" +
      "  ##############################################\n" +
      "  # ?ontid is bound to the set of class IRIs of the OWL query \n"+
      "  # enter query here\n\n" +
      "}\n");
  } else {
    qtype.val("filter");
    query.val("SELECT * WHERE {\n" +
    "  ##############################################\n" +
    "  # enter query here \n\n" +
    "  ##############################################\n" +
    "  # filter on ?x \n" +
    "  FILTER ( \n" +
    "    ?x IN ( OWL subclass <http://aber-owl.net/aber-owl/service/> <"+ ontology +">\n" +
    "      { INSERT OWL HERE }\n" +
    "    )\n" +
    "  ) . \n" +
    "}\n");
  }
}

function sendSPARQLQuery() {
  $.ajax({
    'url': '/sparql/sparqowljson.php',
    'type': 'POST',
    'dataType': 'json',
    'data': {
      'radio': $('#qtype').val(),
      'sparqlquery': $('#squery').val(),
      'endpoint': $('#endpoint').val(),
      'short': $('#short').val(),
      'output': 'json'
    },
    'success': function(result) {
      if(result.length > 0) {
        var table = '<thead><tr>',
            fields = [];

        $.each(result[0], function(a, y) {
          table += '<th>'+a+'</th>' 
          fields.push(a);
        });

        table += '</thead><tbody>';

        $.each(result, function(i, item) {
          table += '<tr>';
          $.each(fields, function(f, field) {
            table += '<td>' + item[field] + '</td>';  
          });
          table += '</tr>';
        });
        
        table += '</tbody></table>';
        console.log(table);

        $('#sparql_results').html(table);
      }
    }
  });
}

$(function() {
  changeSPARQLQuery('values');
});
