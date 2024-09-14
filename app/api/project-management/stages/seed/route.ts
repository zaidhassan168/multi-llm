import { db } from '@/firebase' // Adjust the path according to your project structure
import { collection, writeBatch, doc } from 'firebase/firestore'
import { NextResponse } from 'next/server'
// import { stagesData } from '@/data/stages' // Assuming you store the stagesData in a separate file
import { Stage } from '@/models/stage'



const stagesData: Omit<Stage, 'id'>[] = [
    // Project Integration Management
    { name: 'Develop Project Charter', processGroup: 'Initiating', knowledgeArea: 'Project Integration Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Develop Project Management Plan', processGroup: 'Planning', knowledgeArea: 'Project Integration Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Direct and Manage Project Work', processGroup: 'Executing', knowledgeArea: 'Project Integration Management', completionTime: 5, owner: 'Project Manager' },
    { name: 'Manage Project Knowledge', processGroup: 'Executing', knowledgeArea: 'Project Integration Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Monitor and Control Project Work', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Integration Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Perform Integrated Change Control', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Integration Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Close Project or Phase', processGroup: 'Closing', knowledgeArea: 'Project Integration Management', completionTime: 1, owner: 'Project Manager' },
  
    // Project Scope Management
    { name: 'Plan Scope Management', processGroup: 'Planning', knowledgeArea: 'Project Scope Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Collect Requirements', processGroup: 'Planning', knowledgeArea: 'Project Scope Management', completionTime: 3, owner: 'Business Analyst' },
    { name: 'Define Scope', processGroup: 'Planning', knowledgeArea: 'Project Scope Management', completionTime: 3, owner: 'Business Analyst' },
    { name: 'Create WBS', processGroup: 'Planning', knowledgeArea: 'Project Scope Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Validate Scope', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Scope Management', completionTime: 2, owner: 'Business Analyst' },
    { name: 'Control Scope', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Scope Management', completionTime: 2, owner: 'Project Manager' },
  
    // Project Schedule Management
    { name: 'Plan Schedule Management', processGroup: 'Planning', knowledgeArea: 'Project Schedule Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Define Activities', processGroup: 'Planning', knowledgeArea: 'Project Schedule Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Sequence Activities', processGroup: 'Planning', knowledgeArea: 'Project Schedule Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Estimate Activity Durations', processGroup: 'Planning', knowledgeArea: 'Project Schedule Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Develop Schedule', processGroup: 'Planning', knowledgeArea: 'Project Schedule Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Control Schedule', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Schedule Management', completionTime: 2, owner: 'Project Manager' },
  
    // Project Cost Management
    { name: 'Plan Cost Management', processGroup: 'Planning', knowledgeArea: 'Project Cost Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Estimate Costs', processGroup: 'Planning', knowledgeArea: 'Project Cost Management', completionTime: 3, owner: 'Finance Manager' },
    { name: 'Determine Budget', processGroup: 'Planning', knowledgeArea: 'Project Cost Management', completionTime: 3, owner: 'Finance Manager' },
    { name: 'Control Costs', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Cost Management', completionTime: 2, owner: 'Finance Manager' },
  
    // Project Quality Management
    { name: 'Plan Quality Management', processGroup: 'Planning', knowledgeArea: 'Project Quality Management', completionTime: 2, owner: 'Quality Assurance Manager' },
    { name: 'Manage Quality', processGroup: 'Executing', knowledgeArea: 'Project Quality Management', completionTime: 3, owner: 'Quality Assurance Manager' },
    { name: 'Control Quality', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Quality Management', completionTime: 2, owner: 'Quality Assurance Manager' },
  
    // Project Resource Management
    { name: 'Plan Resource Management', processGroup: 'Planning', knowledgeArea: 'Project Resource Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Estimate Activity Resources', processGroup: 'Planning', knowledgeArea: 'Project Resource Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Acquire Resources', processGroup: 'Executing', knowledgeArea: 'Project Resource Management', completionTime: 2, owner: 'Resource Manager' },
    { name: 'Develop Team', processGroup: 'Executing', knowledgeArea: 'Project Resource Management', completionTime: 4, owner: 'Project Manager' },
    { name: 'Manage Team', processGroup: 'Executing', knowledgeArea: 'Project Resource Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Control Resources', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Resource Management', completionTime: 2, owner: 'Resource Manager' },
  
    // Project Communications Management
    { name: 'Plan Communications Management', processGroup: 'Planning', knowledgeArea: 'Project Communications Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Manage Communications', processGroup: 'Executing', knowledgeArea: 'Project Communications Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Monitor Communications', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Communications Management', completionTime: 2, owner: 'Project Manager' },
  
    // Project Risk Management
    { name: 'Plan Risk Management', processGroup: 'Planning', knowledgeArea: 'Project Risk Management', completionTime: 2, owner: 'Risk Manager' },
    { name: 'Identify Risks', processGroup: 'Planning', knowledgeArea: 'Project Risk Management', completionTime: 3, owner: 'Risk Manager' },
    { name: 'Perform Qualitative Risk Analysis', processGroup: 'Planning', knowledgeArea: 'Project Risk Management', completionTime: 3, owner: 'Risk Manager' },
    { name: 'Perform Quantitative Risk Analysis', processGroup: 'Planning', knowledgeArea: 'Project Risk Management', completionTime: 3, owner: 'Risk Manager' },
    { name: 'Plan Risk Responses', processGroup: 'Planning', knowledgeArea: 'Project Risk Management', completionTime: 2, owner: 'Risk Manager' },
    { name: 'Implement Risk Responses', processGroup: 'Executing', knowledgeArea: 'Project Risk Management', completionTime: 3, owner: 'Risk Manager' },
    { name: 'Monitor Risks', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Risk Management', completionTime: 2, owner: 'Risk Manager' },
  
    // Project Procurement Management
    { name: 'Plan Procurement Management', processGroup: 'Planning', knowledgeArea: 'Project Procurement Management', completionTime: 2, owner: 'Procurement Manager' },
    { name: 'Conduct Procurements', processGroup: 'Executing', knowledgeArea: 'Project Procurement Management', completionTime: 3, owner: 'Procurement Manager' },
    { name: 'Control Procurements', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Procurement Management', completionTime: 2, owner: 'Procurement Manager' },
  
    // Project Stakeholder Management
    { name: 'Identify Stakeholders', processGroup: 'Initiating', knowledgeArea: 'Project Stakeholder Management', completionTime: 2, owner: 'Project Manager' },
    { name: 'Plan Stakeholder Engagement', processGroup: 'Planning', knowledgeArea: 'Project Stakeholder Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Manage Stakeholder Engagement', processGroup: 'Executing', knowledgeArea: 'Project Stakeholder Management', completionTime: 3, owner: 'Project Manager' },
    { name: 'Monitor Stakeholder Engagement', processGroup: 'Monitoring and Controlling', knowledgeArea: 'Project Stakeholder Management', completionTime: 2, owner: 'Project Manager' }
  ]
  
// Batch insert stages into Firestore
export async function POST() {
  const batch = writeBatch(db) // Firestore batch operation
  const stagesCollection = collection(db, 'stages') // Reference to the 'stages' collection

  try {
    stagesData.forEach((stage) => {
      const stageRef = doc(stagesCollection) // Auto-generate Firestore document ID
      const stageWithId = { ...stage, id: stageRef.id } // Insert Firestore-generated ID into the stage data
      batch.set(stageRef, stageWithId) // Add each stage with its generated ID to the batch
    })

    // Commit the batch insert
    await batch.commit()
    return NextResponse.json({ success: true, message: 'Stages inserted successfully' })
  } catch (error) {
    console.error('Error inserting stages:', error)
    return NextResponse.json({ error: 'Failed to insert stages' }, { status: 500 })
  }
}
