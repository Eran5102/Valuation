import { Routes, Route, useParams } from 'react-router-dom'
import { WorkspaceSidebar } from '../../components/workspace/WorkspaceSidebar'
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader'
import { AiAssistantFooter } from '../../components/workspace/AiAssistantFooter'
import ProjectSummary from './ProjectSummary'
import CompanyData from './CompanyData'
import MethodologyScope from './MethodologyScope'
import CoreProjectAssumptions from './CoreProjectAssumptions'
import QualitativeAssessment from './QualitativeAssessment'
import ScenarioManager from './ScenarioManager'
import DcfAnalysis from './methodologies/DcfAnalysis'
import PublicComps from './methodologies/PublicComps'
import PrecedentTransactions from './methodologies/PrecedentTransactions'
import CapitalizationEarnings from './methodologies/CapitalizationEarnings'
import AdjustedBookValue from './methodologies/AdjustedBookValue'
import CostApproach from './methodologies/CostApproach'
import ValuationSynthesis from './ValuationSynthesis'
import ReportGenerator from './ReportGenerator'
import ProjectHistory from './ProjectHistory'
import WorkingCapitalSchedule from './WorkingCapitalSchedule'
import CapTable from './CapTable'
import WaccCalculator from './WaccCalculator'
import DepreciationCapexSchedule from './DepreciationCapexSchedule'
import DebtSchedule from './DebtSchedule'
import ProjectedFinancials from './ProjectedFinancials'
import Documents from './Documents'
import ProjectSettings from './ProjectSettings'
// Import the methodology pages
import IncomeMultiplier from './methodologies/IncomeMultiplier'
import DividendDiscount from './methodologies/DividendDiscount'
import EarningsBased from './methodologies/EarningsBased'
import EvaValuation from './methodologies/EvaValuation'
import ResidualIncome from './methodologies/ResidualIncome'
import LiquidationValue from './methodologies/LiquidationValue'
import OpmBacksolve from './methodologies/OpmBacksolve'

export default function ValuationWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="flex h-screen">
      <WorkspaceSidebar projectId={projectId || 'new'} />
      <div className="flex flex-1 flex-col">
        <WorkspaceHeader projectId={projectId || 'new'} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProjectSummary />} />
            <Route path="/company-data" element={<CompanyData />} />
            <Route path="/methodology-scope" element={<MethodologyScope />} />
            <Route path="/core-assumptions" element={<CoreProjectAssumptions />} />
            <Route path="/qualitative" element={<QualitativeAssessment />} />
            <Route path="/scenarios" element={<ScenarioManager />} />
            <Route path="/dcf" element={<DcfAnalysis />} />
            <Route path="/public-comps" element={<PublicComps />} />
            <Route path="/precedent-transactions" element={<PrecedentTransactions />} />
            <Route path="/cap-earnings" element={<CapitalizationEarnings />} />
            <Route path="/adjusted-book-value" element={<AdjustedBookValue />} />
            <Route path="/cost-approach" element={<CostApproach />} />
            <Route path="/valuation-summary" element={<ValuationSynthesis />} />
            <Route path="/report" element={<ReportGenerator />} />
            <Route path="/history" element={<ProjectHistory />} />
            <Route path="/working-capital" element={<WorkingCapitalSchedule />} />
            <Route path="/cap-table" element={<CapTable />} />
            <Route path="/wacc" element={<WaccCalculator />} />
            <Route path="/depreciation-capex" element={<DepreciationCapexSchedule />} />
            <Route path="/debt-schedule" element={<DebtSchedule />} />
            <Route path="/projected-financials" element={<ProjectedFinancials />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<ProjectSettings />} />

            {/* Methodology routes */}
            <Route path="/income-multiplier" element={<IncomeMultiplier />} />
            <Route path="/dividend-discount" element={<DividendDiscount />} />
            <Route path="/earnings-based" element={<EarningsBased />} />
            <Route path="/eva-valuation" element={<EvaValuation />} />
            <Route path="/residual-income" element={<ResidualIncome />} />
            <Route path="/liquidation-value" element={<LiquidationValue />} />
            <Route path="/opm-backsolve" element={<OpmBacksolve />} />
          </Routes>
        </div>
        <AiAssistantFooter />
      </div>
    </div>
  )
}
