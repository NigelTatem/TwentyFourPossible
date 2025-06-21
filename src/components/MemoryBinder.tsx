'use client';

import { useState, useEffect } from 'react';
import { DatabaseService } from '@/lib/database';
import { Challenge, CheckIn, UserProfile } from '@/lib/supabase';

interface MemoryBinderProps {
  onClose: () => void;
}

export default function MemoryBinder({ onClose }: MemoryBinderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false);
  const [newFiles, setNewFiles] = useState<(File & { dataUrl: string })[]>([]);
  const [newLinks, setNewLinks] = useState<string[]>(['']);
  const [editingReflection, setEditingReflection] = useState<boolean>(false);
  const [editingOutcome, setEditingOutcome] = useState<boolean>(false);
  const [editedReflection, setEditedReflection] = useState<string>('');
  const [editedOutcome, setEditedOutcome] = useState<string>('');

  useEffect(() => {
    loadMemoryBinder();
  }, []);

  const loadMemoryBinder = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getMemoryBinder();
      setProfile(data.profile);
      setChallenges(data.challenges);
      setCheckIns(data.recentCheckIns);
    } catch (error) {
      console.error('Error loading memory binder:', error);
      // Set empty data on error so UI still works
      setProfile(null);
      setChallenges([]);
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  const getAverageRating = () => {
    // Get ratings from localStorage where they're actually stored
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completedWithRating = completions.filter((c: any) => c.rating && c.rating > 0);
    if (completedWithRating.length === 0) return '0.0';
    const sum = completedWithRating.reduce((acc: number, c: any) => acc + (c.rating || 0), 0);
    return (sum / completedWithRating.length).toFixed(1);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Convert files to base64 for storage
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          return new Promise<File & { dataUrl: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const fileWithData = Object.assign(file, {
                dataUrl: reader.result as string
              });
              resolve(fileWithData);
            };
            reader.readAsDataURL(file);
          });
        })
      );
      
      setNewFiles(prev => [...prev, ...processedFiles]);
      e.target.value = '';
    }
  };

  // Remove a file from the new files array
  const removeNewFile = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const addFilesToChallenge = () => {
    if (!selectedChallenge || (newFiles.length === 0 && newLinks.filter(link => link.trim()).length === 0)) return;

    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completionIndex = completions.findIndex((c: any) => c.goal === selectedChallenge.goal);
    
    if (completionIndex !== -1) {
      // Add new files
      if (newFiles.length > 0) {
        const newFileData = newFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: file.dataUrl // Use the base64 data URL
        }));
        
        if (!completions[completionIndex].files) {
          completions[completionIndex].files = [];
        }
        completions[completionIndex].files.push(...newFileData);
      }
      
      // Add new links
      const validLinks = newLinks.filter(link => link.trim());
      if (validLinks.length > 0) {
        if (!completions[completionIndex].links) {
          completions[completionIndex].links = [];
        }
        completions[completionIndex].links.push(...validLinks);
      }
      
      completions[completionIndex].hasProof = true;
      localStorage.setItem('make24matter_completions', JSON.stringify(completions));
      
      // Reset state
      setNewFiles([]);
      setNewLinks(['']);
      setShowFileUpload(false);
      
      // Reload data to show new files
      loadMemoryBinder();
    }
  };

  const addLinkField = () => {
    setNewLinks(prev => [...prev, '']);
  };

  const removeLinkField = (index: number) => {
    setNewLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    setNewLinks(prev => prev.map((link, i) => i === index ? value : link));
  };

  const saveReflectionEdit = () => {
    if (!selectedChallenge) return;
    
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completionIndex = completions.findIndex((c: any) => c.goal === selectedChallenge.goal);
    
    if (completionIndex !== -1) {
      completions[completionIndex].reflection = editedReflection.trim();
      localStorage.setItem('make24matter_completions', JSON.stringify(completions));
      
      setEditingReflection(false);
      loadMemoryBinder();
    }
  };

  const saveOutcomeEdit = () => {
    if (!selectedChallenge) return;
    
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completionIndex = completions.findIndex((c: any) => c.goal === selectedChallenge.goal);
    
    if (completionIndex !== -1) {
      completions[completionIndex].outcome = editedOutcome.trim();
      localStorage.setItem('make24matter_completions', JSON.stringify(completions));
      
      setEditingOutcome(false);
      loadMemoryBinder();
    }
  };

  const getCheckInMoods = (challengeGoal: string) => {
    const checkIns = JSON.parse(localStorage.getItem('make24matter_checkins') || '[]');
    return checkIns.filter((checkin: any) => checkin.goal === challengeGoal);
  };

  const removeFileFromChallenge = (fileIndex: number) => {
    if (!selectedChallenge) return;

    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completionIndex = completions.findIndex((c: any) => c.goal === selectedChallenge.goal);
    
    if (completionIndex !== -1 && completions[completionIndex].files) {
      completions[completionIndex].files.splice(fileIndex, 1);
      
      // If no files left, set hasProof to false
      if (completions[completionIndex].files.length === 0) {
        completions[completionIndex].hasProof = false;
      }
      
      localStorage.setItem('make24matter_completions', JSON.stringify(completions));
      loadMemoryBinder();
    }
  };

  const removeLinkFromChallenge = (linkIndex: number) => {
    if (!selectedChallenge) return;

    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    const completionIndex = completions.findIndex((c: any) => c.goal === selectedChallenge.goal);
    
    if (completionIndex !== -1 && completions[completionIndex].links) {
      completions[completionIndex].links.splice(linkIndex, 1);
      localStorage.setItem('make24matter_completions', JSON.stringify(completions));
      loadMemoryBinder();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your memory binder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-bounce-gentle">📚</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Memory Binder</h2>
              <p className="text-gray-600 text-sm">Your 24-hour challenge journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors hover:scale-110 transform"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'insights', label: 'Insights', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedChallenge && activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Challenge List */}
              <div className="space-y-4">
                {challenges.map((challenge) => {
                  // Get completion data for this challenge
                  const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
                  const completion = completions.find((c: any) => c.goal === challenge.goal);
                  
                  return (
                    <div 
                      key={challenge.id} 
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02]"
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setShowFileUpload(false);
                        setNewFiles([]);
                        setNewLinks(['']);
                        setEditingReflection(false);
                        setEditingOutcome(false);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{challenge.goal}</h4>
                          <p className="text-sm text-gray-500">{formatDate(challenge.created_at)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500 text-xl">✅</span>
                          {challenge.rating && (
                            <div className="flex">
                              {Array.from({ length: challenge.rating }, (_, i) => (
                                <span key={i} className="text-yellow-400">⭐</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(challenge.outcome || completion?.outcome) && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {challenge.outcome || completion?.outcome}
                        </p>
                      )}
                      
                      {completion?.files && completion.files.length > 0 && (
                        <div className="flex items-center text-xs text-blue-600">
                          <span className="mr-1">📎</span>
                          {completion.files.length} file{completion.files.length !== 1 ? 's' : ''} attached
                        </div>
                      )}
                    </div>
                  );
                })}
                {challenges.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-500">No challenges yet. Start your first 24-hour challenge!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedChallenge && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedChallenge(null);
                  setShowFileUpload(false);
                  setNewFiles([]);
                  setNewLinks(['']);
                  setEditingReflection(false);
                  setEditingOutcome(false);
                }}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="mr-2">←</span>
                Back to Overview
              </button>

                             {/* Challenge Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedChallenge.goal}</h2>
                    <p className="text-sm text-gray-500">
                      Completed: {formatDate(selectedChallenge.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedChallenge.rating && (
                      <div className="flex">
                        {Array.from({ length: selectedChallenge.rating }, (_, i) => (
                          <span key={i} className="text-yellow-400 text-xl">⭐</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Outcome Section */}
                {(() => {
                  const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
                  const completion = completions.find((c: any) => c.goal === selectedChallenge.goal);
                  const outcome = selectedChallenge.outcome || completion?.outcome;
                  
                  if (editingOutcome) {
                    return (
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700 mb-2">What you accomplished:</h3>
                        <textarea
                          value={editedOutcome}
                          onChange={(e) => setEditedOutcome(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-24 text-gray-900"
                          maxLength={500}
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={saveOutcomeEdit}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingOutcome(false)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  if (outcome) {
                    return (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-700">What you accomplished:</h3>
                          <button
                            onClick={() => {
                              setEditedOutcome(outcome);
                              setEditingOutcome(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-gray-600">{outcome}</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Reflection Section */}
                {(() => {
                  const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
                  const completion = completions.find((c: any) => c.goal === selectedChallenge.goal);
                  const reflection = selectedChallenge.reflection || completion?.reflection;
                  
                  if (editingReflection) {
                    return (
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700 mb-2">Reflection:</h3>
                        <textarea
                          value={editedReflection}
                          onChange={(e) => setEditedReflection(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-24 text-gray-900"
                          maxLength={500}
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={saveReflectionEdit}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingReflection(false)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-700">Reflection:</h3>
                        <button
                          onClick={() => {
                            setEditedReflection(reflection || '');
                            setEditingReflection(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {reflection ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {reflection ? (
                        <p className="text-gray-600">{reflection}</p>
                      ) : (
                        <p className="text-gray-400 italic">No reflection added yet.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Checkpoint Moods */}
                {(() => {
                  const checkInMoods = getCheckInMoods(selectedChallenge.goal);
                  if (checkInMoods.length > 0) {
                    return (
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700 mb-3">Your Journey:</h3>
                        <div className="flex flex-wrap gap-2">
                          {checkInMoods.map((checkin: any, index: number) => (
                            <div key={index} className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
                              <span className="text-2xl mr-2">{checkin.mood}</span>
                              <div className="text-xs text-gray-600">
                                <div className="font-medium">Checkpoint {index + 1}</div>
                                {checkin.reflection && (
                                  <div className="mt-1 italic">"{checkin.reflection}"</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Files & Links */}
                {(() => {
                  const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
                  const completion = completions.find((c: any) => c.goal === selectedChallenge.goal);
                  
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-700">Files & Links:</h3>
                        <button
                          onClick={() => setShowFileUpload(!showFileUpload)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          + Add Files & Links
                        </button>
                      </div>
                      
                      {/* Existing Images */}
                      {completion?.files && completion.files.filter((file: any) => file.type.startsWith('image/')).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Images:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {completion.files.filter((file: any) => file.type.startsWith('image/')).map((file: any, index: number) => {
                              const originalIndex = completion.files.findIndex((f: any) => f === file);
                              return (
                                <div key={index} className="relative group">
                                  <img
                                    src={file.dataUrl}
                                    alt={file.name}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                    onClick={() => {
                                      // Open image in full screen
                                      const newWindow = window.open();
                                      if (newWindow) {
                                        newWindow.document.write(`
                                          <html>
                                            <head><title>${file.name}</title></head>
                                            <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                              <img src="${file.dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${file.name}">
                                            </body>
                                          </html>
                                        `);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFileFromChallenge(originalIndex);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="truncate">{file.name}</p>
                                    <p>{Math.round(file.size / 1024)}KB</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Videos */}
                      {completion?.files && completion.files.filter((file: any) => file.type.startsWith('video/')).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Videos:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {completion.files.filter((file: any) => file.type.startsWith('video/')).map((file: any, index: number) => {
                              const originalIndex = completion.files.findIndex((f: any) => f === file);
                              return (
                                <div key={index} className="relative group">
                                  <video
                                    src={file.dataUrl}
                                    controls
                                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                  <button
                                    onClick={() => removeFileFromChallenge(originalIndex)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="truncate">{file.name}</p>
                                    <p>{Math.round(file.size / 1024)}KB</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Other Files */}
                      {completion?.files && completion.files.filter((file: any) => !file.type.startsWith('image/') && !file.type.startsWith('video/')).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Other Files:</h4>
                          <div className="space-y-2">
                            {completion.files.filter((file: any) => !file.type.startsWith('image/') && !file.type.startsWith('video/')).map((file: any, index: number) => {
                              const originalIndex = completion.files.findIndex((f: any) => f === file);
                              return (
                                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg group">
                                  <div className="text-2xl mr-3">
                                    {file.type.includes('pdf') ? '📄' : '📎'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{Math.round(file.size / 1024)}KB</p>
                                  </div>
                                  <button
                                    onClick={() => removeFileFromChallenge(originalIndex)}
                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Links */}
                      {completion?.links && completion.links.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Links:</h4>
                          <div className="space-y-2">
                            {completion.links.map((link: string, index: number) => (
                              <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg group">
                                <div className="text-2xl mr-3">🔗</div>
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm truncate flex-1"
                                >
                                  {link}
                                </a>
                                <button
                                  onClick={() => removeLinkFromChallenge(index)}
                                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Interface */}
                      {showFileUpload && (
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 mb-4">
                          {/* File Upload */}
                          <div className="mb-4">
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*,.pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="hidden"
                              id="add-files-upload"
                            />
                            <label htmlFor="add-files-upload" className="cursor-pointer block text-center">
                              <div className="text-3xl mb-2">📁</div>
                              <p className="text-gray-600 mb-2">
                                {newFiles.length > 0 
                                  ? `${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} selected` 
                                  : 'Click to add photos, videos, or documents'
                                }
                              </p>
                            </label>
                            
                            {/* New Files Preview */}
                            {newFiles.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Files to Add:</h5>
                                <div className="grid grid-cols-2 gap-3">
                                  {newFiles.map((file, index) => (
                                    <div key={index} className="relative group">
                                      {file.type.startsWith('image/') ? (
                                        <div className="relative">
                                          <img
                                            src={file.dataUrl}
                                            alt={file.name}
                                            className="w-full h-20 object-cover rounded border"
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                            <button
                                              onClick={() => removeNewFile(index)}
                                              className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      ) : file.type.startsWith('video/') ? (
                                        <div className="relative">
                                          <video
                                            src={file.dataUrl}
                                            className="w-full h-20 object-cover rounded border"
                                            muted
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                            <button
                                              onClick={() => removeNewFile(index)}
                                              className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between bg-white px-2 py-1 rounded border group">
                                          <span className="text-sm truncate">
                                            📎 {file.name} ({Math.round(file.size / 1024)}KB)
                                          </span>
                                          <button
                                            onClick={() => removeNewFile(index)}
                                            className="text-red-500 hover:text-red-700 ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                      {(file.type.startsWith('image/') || file.type.startsWith('video/')) && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Links Section */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">Add Links:</label>
                              <button
                                onClick={addLinkField}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                + Add Link
                              </button>
                            </div>
                            {newLinks.map((link, index) => (
                              <div key={index} className="flex items-center space-x-2 mb-2">
                                <input
                                  type="url"
                                  value={link}
                                  onChange={(e) => updateLink(index, e.target.value)}
                                  placeholder="https://example.com/your-work"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {newLinks.length > 1 && (
                                  <button
                                    onClick={() => removeLinkField(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Upload Actions */}
                          {(newFiles.length > 0 || newLinks.some(link => link.trim())) && (
                            <div className="flex space-x-2">
                              <button
                                onClick={addFilesToChallenge}
                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                Add Content
                              </button>
                              <button
                                onClick={() => {
                                  setNewFiles([]);
                                  setNewLinks(['']);
                                  setShowFileUpload(false);
                                }}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!completion?.files?.length && !completion?.links?.length && !showFileUpload && (
                        <p className="text-gray-500 text-sm italic">No files or links attached yet.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
                  <div className="text-3xl font-bold">{profile?.total_challenges || 0}</div>
                  <div className="text-sm opacity-90">Total Completed</div>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-6 rounded-lg">
                  <div className="flex items-center space-x-1 mb-1">
                    {Array.from({ length: 5 }, (_, i) => {
                      const rating = parseFloat(getAverageRating());
                      const isFullStar = i < Math.floor(rating);
                      const isHalfStar = i === Math.floor(rating) && rating % 1 >= 0.5;
                      
                      return (
                        <div key={i} className="relative text-xl">
                          {/* Background empty star */}
                          <span className="text-white/30">★</span>
                          {/* Overlay filled star */}
                          {isFullStar && (
                            <span className="absolute inset-0 text-yellow-300">★</span>
                          )}
                          {/* Half star overlay */}
                          {isHalfStar && (
                            <span 
                              className="absolute inset-0 text-yellow-300 overflow-hidden"
                              style={{ clipPath: 'inset(0 50% 0 0)' }}
                            >
                              ★
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-sm opacity-90">{getAverageRating()}/5 Average Rating</div>
                </div>
              </div>

              {/* Mood Trends */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Usual Mood</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {['🚀', '💪', '😊', '😐', '😵‍💫', '😴'].map((mood) => {
                    // Get mood data from localStorage where it's actually stored
                    const localCheckIns = JSON.parse(localStorage.getItem('make24matter_checkins') || '[]');
                    const count = localCheckIns.filter((c: any) => c.mood === mood).length;
                    return (
                      <div key={mood} className="text-center">
                        <div className="text-4xl mb-2">{mood}</div>
                        <div className="text-lg font-bold text-gray-800">{count}</div>
                        <div className="text-xs text-gray-500">times</div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const localCheckIns = JSON.parse(localStorage.getItem('make24matter_checkins') || '[]');
                  if (localCheckIns.length > 0) {
                    const moodCounts = ['🚀', '💪', '😊', '😐', '😵‍💫', '😴'].map(mood => ({
                      mood,
                      count: localCheckIns.filter((c: any) => c.mood === mood).length
                    }));
                    const mostCommon = moodCounts.reduce((max, current) => current.count > max.count ? current : max);
                    return (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Most common: {mostCommon.mood} ({mostCommon.count} time{mostCommon.count !== 1 ? 's' : ''})
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500 italic">
                        Complete some milestone check-ins to see your mood patterns! 📊
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">🌟</div>
                <h3 className="text-lg font-semibold mb-2">Keep Going!</h3>
                <p className="text-sm opacity-90">
                  {profile?.total_challenges && profile.total_challenges > 0 
                    ? `You've completed ${profile.total_challenges} challenge${profile.total_challenges !== 1 ? 's' : ''}! Each one makes you stronger.`
                    : "Start your first challenge and begin building momentum!"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 