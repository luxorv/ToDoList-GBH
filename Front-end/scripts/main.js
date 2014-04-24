var defaults = {
	task: 'task',
	todoContainer: '#todo',
	doneContainer: '#done',
	addButton: '#add-btn',
	addInput: '#add-input',
	doneBtn: '#done-btn',
	taskId: 'task-',
	completeButton: 'complete-btn btn btn-lg btn-success',
	undoButton: 'undo-btn hidden btn btn-lg btn-warning',
	editButton: 'edit-btn btn btn-lg btn-primary',
	deleteButton: 'delete-btn btn btn-lg btn-danger',
	progressBar: '.progress-bar',
	td: '<td></td>'
};

var tasks = [];

function postToServer(request)
{
	var data = {
		id: request.id,
		title: request.content,
		description: '',
		done: request.status === 'done'
	},
	
	url = "http://localhost:5000/todo/api/v1.0/tasks";
	
	if(request.type === 'put')
		url += "/"+(request.index+1);
	
	data = JSON.stringify(data);
	
	$.ajax
	({ 
		type: request.type,
		url: url,
		data: data,
		success: function(data) {
		
			if(request.type === 'post')
				addTask(request);
		},
		contentType: "application/json",
		dataType: "json"
	});
}

function deleteFromServer(taskId)
{
	$.ajax
	({
	    url: "http://localhost:5000/todo/api/v1.0/tasks/"+taskId,
	    type: 'DELETE',
	    success: function(result) 
	    {
	        console.log(result);
	    }
	 });
}

function task(params)
{
	this.id = defaults.taskId;
	this.index = params.index;
	this.content = params.content;
	this.status = params.status;
	this.template = "";
	
	this.init = function()
	{
		var completeButton = $('<button />',{
			"class": defaults.completeButton,
			"id": this.id+this.index+'-complete'
		}),
			undoButton = $('<button />',{
			"class": defaults.undoButton,
			"id": this.id+this.index+'-undo'
		}),
		editButton = $('<button />',{
			"class": defaults.editButton,
			"id": this.id+this.index+'-edit'
		}),
			deleteButton = $('<button />',{
			"class": defaults.deleteButton,
			"id": this.id+this.index+'-delete'
		});
		
		editButton.html('Edit');
		completeButton.html('Complete');
		undoButton.html('Undo');
		deleteButton.html('Delete');
		
		this.template = "<tr class='task' id="+this.id+this.index+"><td><span id='"+this.id+this.index+"-text'>"+this.content+"</span></td><td>"+completeButton[0].outerHTML+"</td><td>"+editButton[0].outerHTML+"</td><td>"+undoButton[0].outerHTML+"</td><td>"+deleteButton[0].outerHTML+"</td></tr>";
	};
	
	this.registerEvents = function()
	{
		var completeButton = $('#'+this.id+this.index+'-complete'),
			undoButton = $('#'+this.id+this.index+'-undo'),
			editButton = $('#'+this.id+this.index+'-edit'),
			deleteButton = $('#'+this.id+this.index+'-delete');
		
		completeButton.click(this.done);
		editButton.click(this.edit);
		undoButton.click(this.undo);
		deleteButton.click(this.deleted);
	}
	
	this.done = function(eventObject)
	{	
		var	undoid = this.id.substr(0, 7)+'undo',
			deleteid = this.id.substr(0, 7)+'delete',
			editid = this.id.substr(0, 7)+'edit',
			index = undoid.substr(5, 1);
			
		var task = tasks[index];
		
		$('#'+task.id+task.index).remove();
		
		$(defaults.doneContainer).append(task.template);
		
		var completeButton = $('#'+this.id),
			undoButton = $('#'+undoid),
			editButton = $('#'+editid),
			deleteButton = $('#'+deleteid);
		
		completeButton.addClass('hidden');
		undoButton.removeClass('hidden');
		
		undoButton.click(task.undo);
		deleteButton.click(task.deleted);
	};
	
	this.edit = function(eventObject)
	{
		var	taskid = this.id.substr(0, 7);
		
		var text = $('#'+taskid+'text').html();
		
		$(defaults.addInput).val(text);
		var index = taskid.substr(5, 1);
		
		$(defaults.addButton).addClass('hidden');
		$(defaults.doneBtn).removeClass('hidden');
		
		$(defaults.doneBtn).addClass(index);
		
		$(defaults.doneBtn).click(tasks[index].doneEdit);
	};
	
	this.doneEdit = function(eventObject)
	{
		var text = $(defaults.addInput).val(),
			classes = $(defaults.doneBtn).attr('class');
		
		var index = classes[classes.length - 1];
		var task = tasks[index];
		
		var taskid = task.id+task.index;
		
		if(text !== "")
		{
			$(defaults.addButton).addClass('hidden');
			$(defaults.doneBtn).removeClass('hidden');
			task.content = text;
			$('#'+taskid+'-text').text(text);
			$(defaults.addInput).val("");
			
			task.type = 'put';
			
			postToServer(task);
		}	
	},
	
	this.undo = function(eventObject)
	{
		var	completeid = this.id.substr(0, 7)+'complete',
			deleteid = this.id.substr(0, 7)+'delete',
			index = deleteid.substr(5, 1);
			
		var task = tasks[index];
		
		$('#'+task.id+task.index).remove();
		
		$(defaults.todoContainer).append(task.template);
		
		var completeButton = $('#'+completeid),
			undoButton = $('#'+this.id),
			deleteButton = $('#'+deleteid);
			
		console.log(completeButton);
		
		completeButton.removeClass('hidden');
		undoButton.addClass('hidden');
		
		completeButton.click(task.done);
		deleteButton.click(task.deleted);
	};
	
	this.deleted = function(eventObject)
	{
		var	undoid = this.id.substr(0, 7)+'undo',
			index = undoid.substr(5, 1);
		
		
		if(tasks.length === 1)
			index = 0;
		
		var task = tasks[index];
		
		$('#'+task.id+task.index).remove();
		
		var tempTasks = [];
		
		for(var i=0;i<tasks.length;i++)
		{
			if(tasks[i] === task)
			{
				index = i;
				continue;
			}
			tempTasks.push(tasks[i]);
		}
		
		deleteFromServer(index);
		
		tasks = tempTasks;
	};
}

function main()
{	
	$(defaults.addButton).click(add);
	
	fillFromServer();
}

function fillFromServer()
{
	$.ajax({
		url: "http://localhost:5000/todo/api/v1.0/tasks"
  	}).done(function( data ) {
  
	  	data = data.tasks;
    	for(var i=0;i<data.length;i++)
    	{
    		var size = $(defaults.todoContainer+' tr').length + $(defaults.doneContainer+' tr').length,
    			container;
    		
    		if(data[i].done)
    			container = $(defaults.doneContainer);
    		else container = $(defaults.todoContainer);
    		
	    	addTask({
	    		index: size,
	    		id: defaults.taskId+size,
	    		content: data[i].title,
	    		status: data[i].done ? 'done': 'todo',
	    		container: container
	    	});
    	}
  });
}

function add()
{
	var input = $(defaults.addInput);
	
	if(input.val() != "")
	{
		var task = {
			index: $(defaults.todoContainer+' tr').length,
			id: defaults.taskId+$(defaults.todoContainer+' tr').length,
			content: input.val(),
			status: 'todo',
			container: $(defaults.todoContainer),
			type: 'post'
		};
		
		postToServer(task);
		
		input.val('');
	}
}

function addTask(params)
{
	var newTask = new task({
		id: params.id,
		index: params.index,
		content: params.content,
		status: params.status
	});
	
	newTask.init();
		
	tasks.push(newTask);
	
	params.container.append(newTask.template);
	
	newTask.registerEvents();
	
	if(params.status === 'done')
		$(newTask.id+'-completed').click();
}

$(document).ready(main);