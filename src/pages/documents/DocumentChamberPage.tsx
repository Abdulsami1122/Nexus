import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, Edit, X, Download, Eye, PenTool } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { DealDocument } from '../../types';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Mock deals data
const mockDeals = [
  {
    id: 'deal-1',
    startupName: 'TechWave AI',
    amount: '$1.5M',
    entrepreneurId: 'e1',
    investorId: 'i1',
  },
  {
    id: 'deal-2',
    startupName: 'GreenLife Solutions',
    amount: '$2M',
    entrepreneurId: 'e2',
    investorId: 'i2',
  },
];

// Mock documents
let documents: DealDocument[] = [
  {
    id: 'doc-1',
    dealId: 'deal-1',
    name: 'Term Sheet.pdf',
    type: 'application/pdf',
    size: 245760,
    url: '#',
    status: 'draft',
    uploadedBy: 'e1',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    dealId: 'deal-1',
    name: 'Investment Agreement.pdf',
    type: 'application/pdf',
    size: 512000,
    url: '#',
    status: 'in_review',
    uploadedBy: 'i1',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-3',
    dealId: 'deal-2',
    name: 'Contract.pdf',
    type: 'application/pdf',
    size: 380000,
    url: '#',
    status: 'signed',
    uploadedBy: 'e2',
    uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    signedBy: ['e2', 'i2'],
    signedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Signature Pad Component
const SignaturePad: React.FC<{
  onSave: (signature: string) => void;
  onClose: () => void;
  documentName: string;
}> = ({ onSave, onClose, documentName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signature = canvas.toDataURL('image/png');
    onSave(signature);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">E-Signature</h2>
            <p className="text-sm text-gray-600 mt-1">Sign: {documentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full border border-gray-200 rounded bg-white cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={clearSignature}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveSignature} disabled={!hasSignature}>
              Sign Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocumentChamberPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDeal, setSelectedDeal] = useState<string>(mockDeals[0]?.id || '');
  const [documentsList, setDocumentsList] = useState<DealDocument[]>(documents);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signingDocument, setSigningDocument] = useState<DealDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DealDocument | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported');
        return;
      }

      const newDoc: DealDocument = {
        id: `doc-${Date.now()}`,
        dealId: selectedDeal,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        status: 'draft',
        uploadedBy: user?.id || '',
        uploadedAt: new Date().toISOString(),
      };

      documents.push(newDoc);
      setDocumentsList([...documents]);
      toast.success(`Uploaded ${file.name}`);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const handleStatusChange = (docId: string, newStatus: DealDocument['status']) => {
    const updated = documentsList.map(doc =>
      doc.id === docId ? { ...doc, status: newStatus } : doc
    );
    setDocumentsList(updated);
    documents = updated;
    toast.success(`Document status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleSign = (doc: DealDocument) => {
    setSigningDocument(doc);
    setShowSignaturePad(true);
  };

  const handleSaveSignature = (signature: string) => {
    if (!signingDocument || !user) return;

    const updated = documentsList.map(doc => {
      if (doc.id === signingDocument.id) {
        const signedBy = doc.signedBy || [];
        if (!signedBy.includes(user.id)) {
          signedBy.push(user.id);
        }
        return {
          ...doc,
          status: 'signed' as const,
          signatureData: signature,
          signedBy,
          signedAt: new Date().toISOString(),
        };
      }
      return doc;
    });

    setDocumentsList(updated);
    documents = updated;
    setShowSignaturePad(false);
    setSigningDocument(null);
    toast.success('Document signed successfully!');
  };

  const getStatusBadge = (status: DealDocument['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">Draft</Badge>;
      case 'in_review':
        return <Badge variant="accent">In Review</Badge>;
      case 'signed':
        return <Badge variant="success">Signed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const currentDeal = mockDeals.find(d => d.id === selectedDeal);
  const dealDocuments = documentsList.filter(doc => doc.dealId === selectedDeal);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Manage contracts and documents for your deals</p>
        </div>
      </div>

      {/* Deal Selector */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <label className="form-label whitespace-nowrap">Select Deal:</label>
            <select
              value={selectedDeal}
              onChange={(e) => setSelectedDeal(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
            >
              {mockDeals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.startupName} - {deal.amount}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Upload Documents</h2>
        </CardHeader>
        <CardBody>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-primary-600 font-medium">Drop PDF files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop PDF files here, or click to select
                </p>
                <p className="text-sm text-gray-500">Only PDF documents are supported</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Documents for {currentDeal?.startupName}
          </h2>
        </CardHeader>
        <CardBody>
          {dealDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first document above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dealDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <FileText size={24} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{doc.name}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                        {doc.signedAt && (
                          <>
                            <span>•</span>
                            <span className="text-success-600">
                              Signed {format(new Date(doc.signedAt), 'MMM d, yyyy')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDocument(doc)}
                    >
                      <Eye size={18} className="mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download size={18} className="mr-1" />
                      Download
                    </Button>
                    {doc.status !== 'signed' && (
                      <>
                        {doc.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(doc.id, 'in_review')}
                          >
                            <Clock size={18} className="mr-1" />
                            Mark for Review
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSign(doc)}
                        >
                          <PenTool size={18} className="mr-1" />
                          Sign
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preview Modal */}
      {previewDocument && (
        <div className="modal-overlay" onClick={() => setPreviewDocument(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{previewDocument.name}</h2>
              <button
                onClick={() => setPreviewDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 h-96 overflow-auto">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">PDF Preview</p>
                  <p className="text-sm text-gray-500 mt-2">
                    In a production app, this would display the actual PDF content
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(previewDocument.url, '_blank')}
                  >
                    <Download size={18} className="mr-2" />
                    Download to View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      {showSignaturePad && signingDocument && (
        <SignaturePad
          documentName={signingDocument.name}
          onSave={handleSaveSignature}
          onClose={() => {
            setShowSignaturePad(false);
            setSigningDocument(null);
          }}
        />
      )}
    </div>
  );
};
