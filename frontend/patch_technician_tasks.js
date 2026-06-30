const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'technician', 'tasks', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add internalTasks and taskTab state
content = content.replace(
  "  const [tasks, setTasks] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);",
  "  const [tasks, setTasks] = useState<any[]>([]);\n  const [internalTasks, setInternalTasks] = useState<any[]>([]);\n  const [taskTab, setTaskTab] = useState<'service' | 'internal'>('service');\n  const [loading, setLoading] = useState(true);"
);

// 2. Replace loadTasks
const oldLoadTasks = `  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/technician/my-tasks');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };`;

const newLoadTasks = `  const loadTasks = async () => {
    setLoading(true);
    try {
      const [serviceData, internalData] = await Promise.all([
        fetchWithAuth('/technician/my-tasks').catch(() => []),
        fetchWithAuth('/internal/tasks').catch(() => [])
      ]);
      setTasks(serviceData || []);
      setInternalTasks(internalData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateInternalTaskStatus = async (taskId: string, status: string) => {
    const newNotes = prompt("Add any notes for this update (optional):", "");
    try {
      await fetchWithAuth(\`/internal/tasks/\${taskId}/status\`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes: newNotes || undefined })
      });
      alert(\`Task marked as \${status}\`);
      loadTasks();
    } catch (error: any) {
      alert(error.message || "Failed to update task");
    }
  };`;
content = content.replace(oldLoadTasks, newLoadTasks);

// 3. Add Tab Selector below header
const headerEnd = `</header>`;
const tabsHTML = `</header>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-border-base pb-4">
          <button 
            onClick={() => setTaskTab('service')}
            className={\`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all \${taskTab === 'service' ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-fg-muted hover:bg-bg-muted border border-transparent'}\`}
          >
            Service Jobs
          </button>
          <button 
            onClick={() => setTaskTab('internal')}
            className={\`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all \${taskTab === 'internal' ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-fg-muted hover:bg-bg-muted border border-transparent'}\`}
          >
            Internal Tasks
          </button>
        </div>`;
content = content.replace(headerEnd, tabsHTML);

// 4. Wrap Task Grid and Add Internal Tasks Grid
const oldTaskGridNoTasks = `tasks.length === 0 ? (
          <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
            <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Tasks Assigned</p>
            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You have a clear queue</p>
          </div>
        ) : (`;

const newTaskGridNoTasks = `taskTab === 'service' ? (
          tasks.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
              <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Service Jobs</p>
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You have a clear queue</p>
            </div>
          ) : (`;

content = content.replace(oldTaskGridNoTasks, newTaskGridNoTasks);

// The end of the task grid is before the Modals
// Let's find: `</div>\n        )}` which closes the `tasks.length === 0 ? (...) : (...)`
const internalTaskGridHTML = `          </div>
          )
        ) : (
          internalTasks.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
              <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Internal Tasks</p>
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You have a clear queue</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {internalTasks.map((task) => (
                <div key={task._id} className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -z-10 group-hover:bg-purple-600/10 transition-colors"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={\`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border \${task.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : task.status === 'in_progress' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}\`}>
                          {task.status?.replace('_', ' ') || 'Pending'}
                        </span>
                        <h3 className="text-xl font-black text-fg-primary tracking-tight uppercase leading-none mt-4">
                          {task.title}
                        </h3>
                        {task.createdAt && (
                          <p className="text-[9px] font-bold text-fg-muted mt-2 uppercase tracking-widest">{new Date(task.createdAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-border-base">
                      {task.description && (
                        <div className="text-xs font-medium text-fg-secondary">
                          {task.description}
                        </div>
                      )}
                      
                      {task.location?.address && (
                        <div className="flex items-start gap-2 text-[10px] font-bold text-fg-muted">
                           <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                           <span className="leading-tight uppercase">{task.location.address}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-fg-muted">
                           <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                           <span className="uppercase">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {task.notes && (
                         <div className="p-3 bg-bg-muted rounded-xl text-xs text-fg-secondary italic border-l-2 border-blue-500">
                           "{task.notes}"
                         </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-border-base">
                     {task.status !== 'completed' && (
                       <div className="flex gap-3">
                         {task.status === 'pending' && (
                           <button onClick={() => updateInternalTaskStatus(task._id, 'in_progress')} className="flex-1 py-3 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                             Start Task
                           </button>
                         )}
                         <button onClick={() => updateInternalTaskStatus(task._id, 'completed')} className="flex-1 py-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                           Mark Completed
                         </button>
                       </div>
                     )}
                     {task.status === 'completed' && (
                        <div className="w-full py-3 bg-bg-muted text-fg-muted rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-not-allowed">
                          Task Completed
                        </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>`;

// Safely replace the closing braces of the task grid
content = content.replace(/          <\/div>\s*\)\s*\}\s*<\/div>\s*\)\s*\}\s*<\/div>/, internalTaskGridHTML + "\n      </div>");

fs.writeFileSync(filePath, content);
console.log("Successfully patched technician tasks page!");
