// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthDataAggregation {
    struct Study {
        uint256 studyId;
        string studyName;
        string description;
        address creator;
        uint256 createdAt;
        bool isActive;
        uint256 dataCount;
    }

    struct EncryptedData {
        bytes32 encryptedValue;
        address submitter;
        uint256 timestamp;
        uint256 studyId;
    }

    struct StudyStats {
        uint256 totalRecords;
        bytes32 encryptedSum;
        uint256 minValue;
        uint256 maxValue;
        uint256 lastUpdated;
    }

    mapping(uint256 => Study) public studies;
    mapping(uint256 => EncryptedData[]) public studyData;
    mapping(uint256 => StudyStats) public studyStats;
    mapping(address => uint256[]) public userSubmissions;
    
    uint256 public studyCounter;
    
    event StudyCreated(uint256 indexed studyId, address indexed creator, string studyName);
    event DataSubmitted(uint256 indexed studyId, address indexed submitter, bytes32 encryptedValue);
    event StudyStatsUpdated(uint256 indexed studyId, uint256 totalRecords);
    event StudyDeactivated(uint256 indexed studyId);

    function createStudy(string memory _studyName, string memory _description) external returns (uint256) {
        uint256 studyId = studyCounter;
        studyCounter++;

        studies[studyId] = Study({
            studyId: studyId,
            studyName: _studyName,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            dataCount: 0
        });

        studyStats[studyId] = StudyStats({
            totalRecords: 0,
            encryptedSum: bytes32(0),
            minValue: type(uint256).max,
            maxValue: 0,
            lastUpdated: block.timestamp
        });

        emit StudyCreated(studyId, msg.sender, _studyName);
        return studyId;
    }

    function submitData(
        uint256 _studyId,
        bytes32 _encryptedValue,
        bytes calldata,
        uint256 _minValue,
        uint256 _maxValue
    ) external {
        Study storage study = studies[_studyId];
        require(study.isActive, "Study is not active");
        require(_encryptedValue != bytes32(0), "Invalid encrypted value");

        studyData[_studyId].push(EncryptedData({
            encryptedValue: _encryptedValue,
            submitter: msg.sender,
            timestamp: block.timestamp,
            studyId: _studyId
        }));

        study.dataCount++;
        
        StudyStats storage stats = studyStats[_studyId];
        stats.totalRecords++;
        stats.encryptedSum = _encryptedValue;
        if (_minValue < stats.minValue) {
            stats.minValue = _minValue;
        }
        if (_maxValue > stats.maxValue) {
            stats.maxValue = _maxValue;
        }
        stats.lastUpdated = block.timestamp;

        userSubmissions[msg.sender].push(_studyId);

        emit DataSubmitted(_studyId, msg.sender, _encryptedValue);
        emit StudyStatsUpdated(_studyId, stats.totalRecords);
    }

    function deactivateStudy(uint256 _studyId) external {
        Study storage study = studies[_studyId];
        require(study.creator == msg.sender, "Only creator can deactivate");
        require(study.isActive, "Study already deactivated");
        
        study.isActive = false;
        emit StudyDeactivated(_studyId);
    }

    function getStudy(uint256 _studyId) external view returns (
        string memory studyName,
        string memory description,
        address creator,
        uint256 createdAt,
        bool isActive,
        uint256 dataCount
    ) {
        Study storage study = studies[_studyId];
        return (
            study.studyName,
            study.description,
            study.creator,
            study.createdAt,
            study.isActive,
            study.dataCount
        );
    }

    function getStudyStats(uint256 _studyId) external view returns (
        uint256 totalRecords,
        bytes32 encryptedSum,
        uint256 minValue,
        uint256 maxValue,
        uint256 lastUpdated
    ) {
        StudyStats storage stats = studyStats[_studyId];
        return (
            stats.totalRecords,
            stats.encryptedSum,
            stats.minValue,
            stats.maxValue,
            stats.lastUpdated
        );
    }

    function getDataCount(uint256 _studyId) external view returns (uint256) {
        return studyData[_studyId].length;
    }

    function getUserSubmissions(address _user) external view returns (uint256[] memory) {
        return userSubmissions[_user];
    }
}
