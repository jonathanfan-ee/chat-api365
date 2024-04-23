import { useState, useEffect } from 'react';
import { showError } from 'utils/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import ButtonGroup from '@mui/material/ButtonGroup';
import Toolbar from '@mui/material/Toolbar';
import { useNavigate } from 'react-router';
import { Button, Card, Container, Box } from '@mui/material';
import LogTableRow from './component/TableRow';
import LogTableHead from './component/TableHead';
import TableToolBar from './component/TableToolBar';
import { API } from 'utils/api';
import { isAdmin } from 'utils/common';
import { ITEMS_PER_PAGE } from 'constants';
import { IconRefresh, IconSearch,IconPhoto } from '@tabler/icons-react';

export default function Log() {
  const originalKeyword = {
    p: 0,
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: 0,
    end_timestamp: new Date().getTime() / 1000 + 3600,
    type: 0,
    channel: ''
  };
  const [logs, setLogs] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(originalKeyword);
  const [initPage, setInitPage] = useState(true);
  const userIsAdmin = isAdmin();
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [logCount, setLogCount] = useState(ITEMS_PER_PAGE);
  const loadLogs = async (startIdx) => {
    setSearching(true);
    const url = userIsAdmin ? '/api/log/' : '/api/log/self/';
    const query = searchKeyword;

    query.p = startIdx;
    query.pageSize = rowsPerPage;
    if (!userIsAdmin) {
      delete query.username;
      delete query.channel;
    }
    const res = await API.get(url, { params: query });
    const { success, message, data,total } = res.data;
    if (success) {
      if (startIdx === 0) {
        setLogs(data);
        setLogCount(total);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * rowsPerPage, data.length, ...data);
        setLogs(newLogs);
        setLogCount(total);
      }
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const onPaginationChange = (event, newPage) => {
    (async () => {
      if (newPage === Math.ceil(logs.length / rowsPerPage)) {
        // 需要加载更多数据
        await loadLogs(newPage);
      }
      setActivePage(newPage);
    })();
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setActivePage(0);
    loadLogs(0);
  };

  

  const searchLogs = async (event) => {
    event.preventDefault();
    await loadLogs(0);
    setActivePage(0);
    return;
  };

  const handleSearchKeyword = (event) => {
    setSearchKeyword({ ...searchKeyword, [event.target.name]: event.target.value });
  };

  // 处理刷新
  const handleRefresh = () => {
    setInitPage(true);
  };
  const goToLogPage = () => {
    navigate('/mjlog');
  };

  useEffect(() => {
    setSearchKeyword(originalKeyword);
    setActivePage(0);
    loadLogs(0)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    setInitPage(false);
  }, [initPage,rowsPerPage]);

  return (
    <>
      <Card>
        <Box component="form" onSubmit={searchLogs} noValidate>
          <TableToolBar filterName={searchKeyword} handleFilterName={handleSearchKeyword} userIsAdmin={userIsAdmin} />
        </Box>
        <Toolbar
          sx={{
            textAlign: 'right',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            p: (theme) => theme.spacing(0, 1, 0, 3)
          }}
        >
          <Container>
            <ButtonGroup variant="outlined" aria-label="outlined small primary button group">
              <Button onClick={handleRefresh} startIcon={<IconRefresh width={'18px'} />}>
                刷新/清除搜索条件
              </Button>

              <Button onClick={searchLogs} startIcon={<IconSearch width={'18px'} />}>
                搜索
              </Button>
              <Button
                  onClick={goToLogPage}
                  startIcon={<IconPhoto width={'18px'} />}>
                MJ
              </Button>
            </ButtonGroup>
          </Container>
        </Toolbar>
        {searching && <LinearProgress />}
        <PerfectScrollbar component="div">
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <LogTableHead userIsAdmin={userIsAdmin} />
              <TableBody>
                {logs.slice(activePage * rowsPerPage, (activePage + 1) * rowsPerPage).map((row, index) => (
                    <LogTableRow item={row} key={`${row.id}_${index}`} userIsAdmin={userIsAdmin} />
                ))}
            </TableBody>

            </Table>
          </TableContainer>
        </PerfectScrollbar>
        <TablePagination
          component="div"
          page={activePage}
          count={logCount}
          rowsPerPage={rowsPerPage}
          onPageChange={onPaginationChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}  // 确保这里的选项包含了默认的每页行数
        />



      </Card>
    </>
  );
}
