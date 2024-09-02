{/* <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <TaskDetailsPopover task={task} />
                  </TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card> */}