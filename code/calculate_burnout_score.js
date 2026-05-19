(function executeRule(current, previous) {

    var userId = current.assigned_to.toString();
    if (!userId || userId == '') return;

    // Count Open + In Progress tasks
    var activeGR = new GlideRecord('x_snc_burnlytics_burn_task');
    activeGR.addQuery('assigned_to', userId);
    activeGR.addQuery('status', 'IN', 'Open,In Progress');
    activeGR.query();
    var activeTasks = activeGR.getRowCount();

    // Count High priority pending tasks
    var highGR = new GlideRecord('x_snc_burnlytics_burn_task');
    highGR.addQuery('assigned_to', userId);
    highGR.addQuery('priority', 'High');
    highGR.addQuery('status', '!=', 'Completed');
    highGR.query();
    var highPriorityTasks = highGR.getRowCount();

    // Calculate score
    var score = (activeTasks * 5) + (highPriorityTasks * 10);

    // Determine zone
    var zone, riskLevel;
    if (score >= 60) {
        zone = 'critical';
        riskLevel = 'high';
    } else if (score >= 30) {
        zone = 'warning';
        riskLevel = 'medium';
    } else {
        zone = 'safe';
        riskLevel = 'low';
    }

    // Update or create Burnout Score record
    var gr = new GlideRecord('x_snc_burnlytics_burnout_score');
    gr.addQuery('user', userId);
    gr.query();

    if (!gr.next()) {
        gr.initialize();
        gr.setValue('user', userId);
        gr.setValue('burnout_score', score);
        gr.setValue('zone', zone);
        gr.setValue('risk_level', riskLevel);
        gr.insertWithReferences();
    } else {
        gr.setValue('burnout_score', score);
        gr.setValue('zone', zone);
        gr.setValue('risk_level', riskLevel);
        gr.updateWithReferences();
    }

})(current, previous);